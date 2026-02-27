package storage

import (
	"context"
	"time"

	"github.com/farzXr/weatherStation/internal/core/domains"
)

// Storage определяет базовый интерфейс для хранилища данных
type Storage interface {
	// Init инициализирует подключение к хранилищу данных
	Init() error

	// Close закрывает соединение с хранилищем данных
	Close()
}

// StorageQueryExecutor определяет интерфейс для выполнения запросов к хранилищу данных
type StorageQueryExecutor interface {
	// CreateWeather добавляет новую запись о погоде
	CreateWeather(context.Context, *domains.Weather) error

	// GetWeatherByPeriod возвращает записи о погоде за указанный период
	GetWeatherByPeriod(ctx context.Context, stationID string, from time.Time, to time.Time) ([]domains.Weather, error)

	// GetLatestWeather возвращает самую последнюю запись о погоде для станции
	GetLatestWeather(context.Context, string) (*domains.Weather, error)

	// GetWeatherStats возвращает статистические данные о погоде за период
	GetWeatherStats(ctx context.Context, stationID string, from time.Time, to time.Time) (*domains.WeatherStats, error)

	// CreateStation создает новую метеостанцию
	CreateStation(context.Context, *domains.Station) (*domains.Station, error)

	// GetStations возвращает список всех метеостанций
	GetStations(context.Context) ([]domains.Station, error)

	// GetStation возвращает информацию о конкретной метеостанции по её ID
	GetStation(ctx context.Context, stationID string) (*domains.Station, error)

	// EditStation редактирует информацию о конкретной метеостанции по её ID
	EditStation(context.Context, *domains.Station) (*domains.Station, error)

	// DeleteStation удаляет конкретную метеостанцию по её ID
	DeleteStation(ctx context.Context, stationID string) error
}
