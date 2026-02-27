package http

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/farzXr/weatherStation/internal/features/server/service"
)

// TransportHttp представляет HTTP транспортный слой для обработки входящих запросов
type TransportHttp struct {
	Router  *http.ServeMux
	Server  *http.Server
	service service.ServiceProcessor
}

// NewTransportHttp создает новый экземпляр HTTP транспорта
func NewTransportHttp(service service.ServiceProcessor) *TransportHttp {
	// Проверка на nil для предотвращения паники
	if service == nil {
		return nil
	}

	return &TransportHttp{
		service: service,
	}
}

// Init инициализирует маршрутизатор и регистрирует обработчики эндпоинтов
func (t *TransportHttp) Init() error {
	// Проверка, что сервис инициализирован
	if t.service == nil {
		return fmt.Errorf("сервис не инициализирован в HTTP транспорте")
	}

	t.Router = http.NewServeMux()

	// Регистрация эндпоинтов для работы с погодой
	t.Router.HandleFunc(WeatherPeriodPath, t.GetWeatherByPeriod)
	t.Router.HandleFunc(WeatherLatestPath, t.GetLatestWeather)
	t.Router.HandleFunc(WeatherStatsPath, t.GetWeatherStats)

	// Регистрация эндпоинтов для работы со станциями
	t.Router.HandleFunc(StationsCreate, t.CreateStation)
	t.Router.HandleFunc(StationsList, t.GetStations)
	t.Router.HandleFunc(StationByIDPath, t.GetStation)
	t.Router.HandleFunc(StationEditByIDPath, t.EditStation)
	t.Router.HandleFunc(StationDeleteByIDPath, t.DeleteStation)

	log.Println("HTTP маршрутизатор успешно инициализирован")
	return nil
}

// Start запускает HTTP сервер и обрабатывает его завершение
func (t *TransportHttp) Start(ctx context.Context, chReady chan struct{}) error {
	log.Println("Запуск транспортного слоя HTTP")

	// Проверка, что маршрутизатор инициализирован
	if t.Router == nil {
		return fmt.Errorf("маршрутизатор не инициализирован, вызовите Init() перед Start()")
	}

	// Получение порта из переменных окружения или использование значения по умолчанию
	var port string
	if port = os.Getenv("APP_PORT"); port == "" {
		port = "8080"
		log.Printf("Порт не указан в APP_PORT, используется значение по умолчанию: %s", port)
	}

	// Настройка HTTP сервера
	t.Server = &http.Server{
		Addr:         fmt.Sprintf(":%s", port),
		Handler:      t.Router,
		ReadTimeout:  5 * time.Second,   // Таймаут на чтение запроса
		WriteTimeout: 10 * time.Second,  // Таймаут на запись ответа
		IdleTimeout:  120 * time.Second, // Таймаут на простаивающее соединение
	}

	// Канал для получения ошибок от сервера
	serverErrors := make(chan error, 1)

	// Запуск сервера в горутине
	go func() {
		log.Printf("HTTP сервер запущен на порту %s", port)
		if err := t.Server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			serverErrors <- fmt.Errorf("ошибка при запуске HTTP сервера: %w", err)
		}
	}()

	time.Sleep(100 * time.Millisecond)
	chReady <- struct{}{}

	// Ожидание сигнала завершения или ошибки сервера
	select {
	case err := <-serverErrors:
		return fmt.Errorf("критическая ошибка HTTP сервера: %w", err)
	case <-ctx.Done():
		log.Println("Получен сигнал завершения, остановка HTTP сервера...")

		// Создание контекста с таймаутом для graceful shutdown
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()

		// Попытка graceful shutdown
		if err := t.Server.Shutdown(shutdownCtx); err != nil {
			return fmt.Errorf("ошибка при graceful shutdown HTTP сервера: %w", err)
		}

		log.Println("HTTP сервер успешно остановлен")
		return nil
	}
}
