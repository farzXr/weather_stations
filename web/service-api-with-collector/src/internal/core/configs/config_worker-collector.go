package configs

import "time"

// ConfigPoolWorkesrCollector представляет конфигурацию для пула сборщиков данных с метеостанций
type ConfigPoolWorkesrCollector struct {
	APIBaseURLStations string

	// APIBaseURL - базовый URL адрес собственного API приложения
	// Например: "http://localhost:8080"
	APIBaseURL string

	// APILoggingURL - URL адрес внешнего API для логирования статусов
	// Например: "https://logging-service.example.com/api/status"
	APILoggingURL string

	// PollInterval - интервал опроса метеостанции
	// Определяет, как часто собирать данные со станции
	// Например: 30 * time.Second, 1 * time.Minute
	PollInterval time.Duration

	// Timeout - максимальное время ожидания ответа от API
	// Защищает от зависания при недоступности сервисов
	// Например: 5 * time.Second, 10 * time.Second
	Timeout time.Duration

	// RetryCount - количество повторных попыток при ошибках
	// Определяет, сколько раз повторить операцию в случае неудачи
	RetryCount int

	// RetryDelay - задержка между повторными попытками
	// Например: 1 * time.Second, 5 * time.Second
	RetryDelay time.Duration
}

// ConfigWorkerCollector представляет конфигурацию для сборщика данных с метеостанции
type ConfigWorkerCollector struct {
	// StationID - уникальный идентификатор метеостанции
	// Используется для идентификации источника данных
	StationID string

	// StationURL - URL адрес метеостанции для получения данных
	// Например: "http://192.168.1.100:8080/api/sensor"
	StationURL string

	ConfigPoolWorkesrCollector
}
