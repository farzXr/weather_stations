package workercollector

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/farzXr/weatherStation/internal/core/domains"
)

// Start запускает цикл сбора данных с метеостанции
func (c *Collector) Start(ctx context.Context) {
	log.Printf("Запуск сборщика для станции %s (интервал опроса: %v)",
		c.config.StationID, c.config.PollInterval)

	ticker := time.NewTicker(c.config.PollInterval)
	defer func() {
		ticker.Stop()
		c.wg.Done()
	}()

	for {
		select {
		case <-ctx.Done():
			log.Printf("Сборщик для станции %s остановлен (сигнал контекста)",
				c.config.StationID)
			return
		case <-c.stopChan:
			log.Printf("Сборщик для станции %s остановлен вручную", c.config.StationID)
			return
		case <-ticker.C:
			c.collectAndSend(ctx)
		}
	}
}

// Stop останавливает сборщик вручную
func (c *Collector) Stop() {
	select {
	case <-c.stopChan:
		fmt.Println("Канал уже закрыт - ", c.config.StationID)
		return
	default:
		close(c.stopChan)
	}
}

// collectAndSend выполняет сбор данных и отправку в API
func (c *Collector) collectAndSend(ctx context.Context) {
	// Создание данных статуса для отправки сервису Инесы
	var data Status

	var stationData *domains.Weather
	var err error
	var code int

	// Получение данных со станции с повторами (у api Максима)
	for attempt := 0; attempt <= c.config.RetryCount; attempt++ {
		ctx, cancel := context.WithTimeout(ctx, c.config.Timeout*time.Second)
		defer cancel()

		stationData, err, code = c.fetchStationData(ctx)
		if err == nil {
			break
		}

		// log.Printf("Станция %s: попытка %d/%d не удалась: %v",c.config.StationID, attempt+1, c.config.RetryCount+1, err)
		if attempt < c.config.RetryCount {
			time.Sleep(c.config.RetryDelay)
		}
	}

	if err != nil {
		c.reportFailure(err)
		return
	}

	// Отправка данных в собственное API
	err = c.sendToSelfDB(ctx, stationData)
	if err != nil {
		// log.Printf("Ошибка отправки данных в API для станции %s: %v", c.config.StationID, err)
		c.reportFailure(err)
		return
	}

	// Создание данных статуса для отправки логгер сервису (Endpoint Инессы)
	data = NewStatus(err, strconv.Itoa(code))

	// Отправка статуса во внешнее API для логирования
	err = c.sendToExternalApi(ctx, data)
	if err != nil {
		// log.Printf("Ошибка отправки статуса во внешнее API для станции %s: %v", c.config.StationID, err)
		c.reportFailure(err)
		return
	}

	c.reportSuccess(stationData)
}

// fetchStationData получает данные с внешней метеостанции
func (c *Collector) fetchStationData(ctx context.Context) (*domains.Weather, error, int) {
	// Создание HTTP запроса с контекстом
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.config.StationURL, nil)
	if err != nil {
		return nil, fmt.Errorf("ошибка создания запроса к станции %s: %w",
			c.config.StationURL, err), http.StatusInternalServerError
	}

	// Выполнение запроса
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("ошибка выполнения запроса к станции %s: %w",
			c.config.StationURL, err), http.StatusInternalServerError
	}
	defer resp.Body.Close()

	// Проверка статус кода ответа
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("неожиданный статус код от станции: %d",
			resp.StatusCode), resp.StatusCode
	}

	// Декодирование JSON ответа
	var data domains.Weather
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("ошибка декодирования ответа от станции: %w",
			err), http.StatusInternalServerError
	}

	// Устанавливаем ID станции из конфигурации
	data.StationID = c.config.StationID

	return &data, nil, resp.StatusCode
}

// sendToSelfDB отправляет собранные данные в собственную БД
func (c *Collector) sendToSelfDB(ctx context.Context, data *domains.Weather) error {

	if err := c.storage.CreateWeather(ctx, data); err != nil {
		return fmt.Errorf("Ошибка записи данных с погодной станции")
	}

	return nil
}

// sendToExternalApi отправляет статус операции во внешнее API для логирования
func (c *Collector) sendToExternalApi(ctx context.Context, data Status) error {
	// Формирование комментария в зависимости от результат

	// Сериализация в JSON
	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("ошибка сериализации статуса для станции %s: %w",
			c.config.StationID, err)
	}

	// Создание и выполнение запроса
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		c.config.APILoggingURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("ошибка создания запроса к внешнему API для станции %s: %w",
			c.config.StationID, err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("ошибка выполнения запроса к внешнему API для станции %s: %w",
			c.config.StationID, err)
	}
	defer resp.Body.Close()

	// Проверка статус кода ответа (можно добавить проверку на ожидаемый код)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("внешнее API вернуло статус: %d", resp.StatusCode)
	}

	return nil
}

// reportSuccess логирует успешный сбор данных
func (c *Collector) reportSuccess(data *domains.Weather) {
	log.Printf(`✅ Станция %s:
		1. Данные собраны с endpoint: %s [температура=%.2f°C, влажность=%.1f%%, давление=%.1f]
		2. Данные записаны по endpoint: %s
		3. Лог об успешной записи отправлен по endpoint: %s`,
		c.config.StationID, c.config.StationURL, data.Temperature, data.Humidity, data.Pressure, c.config.APIBaseURL, c.config.APILoggingURL)
}

// reportFailure логирует ошибку при сборе данных
func (c *Collector) reportFailure(err error) {
	log.Printf("❌ Станция %s: ошибка - %v", c.config.StationID, err)
}
