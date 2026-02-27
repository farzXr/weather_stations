package service

import (
	"context"
	"time"

	"github.com/farzXr/weatherStation/internal/core/domains"
)

// Service определяет базовый интерфейс для сервисного слоя приложения
type Service interface{}

// ServiceProcessor определяет интерфейс для обработки бизнес-логики
// при работе с метеостанциями и данными о погоде
type ServiceProcessor interface {
	// GetWeatherByPeriod возвращает записи о погоде за указанный период времени
	GetWeatherByPeriod(ctx context.Context, stationID string, from time.Time, to time.Time) ([]domains.Weather, error)

	// GetLatestWeather возвращает самую последнюю запись о погоде для указанной станции
	GetLatestWeather(context.Context, string) (*domains.Weather, error)

	// GetWeatherStats возвращает статистические данные о погоде за указанный период
	GetWeatherStats(ctx context.Context, stationID string, from time.Time, to time.Time) (*domains.WeatherStats, error)

	// CreateStation создает новую метеостанцию
	CreateStation(context.Context, *domains.Station) (*domains.Station, error)

	// GetStations возвращает список всех метеостанций
	GetStations(context.Context) ([]domains.Station, error)

	// GetStation возвращает информацию о конкретной метеостанции по её ID
	GetStation(ctx context.Context, stationID string) (*domains.Station, error)

	// EditStation возвращает информацию о конкретной отредактированной метеостанции по её ID
	EditStation(context.Context, *domains.Station) (*domains.Station, error)

	// DeleteStation удаляет конкретную метеостанции по её ID и останавливает worker
	DeleteStation(ctx context.Context, station *domains.Station) (*domains.Station, error)
}
