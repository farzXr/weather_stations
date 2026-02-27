package di

import (
	"context"
	"fmt"
	"log"
	"sync"

	"github.com/farzXr/weatherStation/internal/core/utils"
	"github.com/farzXr/weatherStation/internal/features/server/service"
	"github.com/farzXr/weatherStation/internal/features/server/service/version1"
	"github.com/farzXr/weatherStation/internal/features/server/storage"
	"github.com/farzXr/weatherStation/internal/features/server/storage/postgres"
	"github.com/farzXr/weatherStation/internal/features/server/transport"
	"github.com/farzXr/weatherStation/internal/features/server/transport/http"
)

// Глобальные переменные для хранения экземпляров зависимостей
var (
	// storagePostgres - экземпляр PostgreSQL хранилища
	storagePostgres *postgres.StoragePostgres

	//
	workersCollector *WorkersCollector

	// serviceV1 - экземпляр сервиса версии 1
	serviceV1 *version1.ServiceV1

	// transportHttp - экземпляр HTTP транспорта
	transportHttp *http.TransportHttp
)

// Server представляет контейнер зависимостей для серверного приложения
// Содержит все основные компоненты, необходимые для работы сервера
type Server struct {
	// Storage - хранилище данных (PostgreSQL)
	Storage storage.Storage

	// Service - сервисный слой с бизнес-логикой
	Service service.Service

	// Transport - транспортный слой для обработки HTTP запросов
	Transport transport.Transport
}

func NewDependenciesLayers(ctx context.Context) {

	// storagePostgres - экземпляр PostgreSQL хранилища
	storagePostgres = postgres.NewStoragePostgres()

	//
	workersCollector = NewWorkersCollector(storagePostgres)

	// serviceV1 - экземпляр сервиса версии 1
	serviceV1 = version1.NewServiceV1(storagePostgres, workersCollector.Pool, ctx)

	// transportHttp - экземпляр HTTP транспорта
	transportHttp = http.NewTransportHttp(serviceV1)

	//
}

// NewServer создает новый экземпляр сервера со всеми внедренными зависимостями
// Реализует паттерн "Внедрение зависимостей" (Dependency Injection)
func NewServer(ctx context.Context) *Server {

	NewDependenciesLayers(ctx)

	// Проверка на nil для предотвращения паники
	if storagePostgres == nil {
		panic("не удалось инициализировать PostgreSQL хранилище")
	}
	if serviceV1 == nil {
		panic("не удалось инициализировать сервис версии 1")
	}
	if transportHttp == nil {
		panic("не удалось инициализировать HTTP транспорт")
	}

	return &Server{
		Storage:   storagePostgres,
		Service:   serviceV1,
		Transport: transportHttp,
	}
}

func (s *Server) Init(ctx context.Context) error {

	// Инициализация хранилища данных (PostgreSQL)
	log.Println("Подключение к базе данных...")
	if err := s.Storage.Init(); err != nil {
		return fmt.Errorf("Критическая ошибка при инициализации хранилища: %v", err)
	}
	log.Println("База данных успешно подключена")

	// Инициализация HTTP транспорта
	log.Println("Настройка HTTP сервера...")
	if err := s.Transport.Init(); err != nil {
		return fmt.Errorf("Критическая ошибка при инициализации транспорта: %v", err)
	}
	log.Println("HTTP сервер настроен")

	return nil
}

func (s *Server) Start(ctx context.Context, cancel context.CancelFunc, wg *sync.WaitGroup) {
	serverReady := make(chan struct{})

	// Запуск HTTP сервера в отдельной горутине
	wg.Add(1)
	go func() {
		defer wg.Done()
		log.Println("Запуск HTTP сервера...")
		if err := s.Transport.Start(ctx, serverReady); err != nil {
			log.Printf("Ошибка при работе HTTP сервера: %v", err)
		}
	}()

	<-serverReady

	// Запуск сборщика данных в отдельной горутине
	wg.Add(1)
	go func() {
		defer wg.Done()
		log.Println("Запуск сборщика данных с метеостанций...")
		workersCollector.Pool.Start(ctx)
	}()

	log.Println("Приложение успешно запущено. Ожидание сигнала завершения...")

	// Ожидание сигнала завершения (Ctrl+C или SIGTERM)
	utils.GracefulShutdown(cancel)

	log.Println("Получен сигнал завершения. Остановка компонентов...")
}
