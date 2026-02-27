package version1

import (
	"context"
	"fmt"
	"time"

	"github.com/farzXr/weatherStation/internal/core/domains"
)

// CreateWeather создает новую запись о погоде
func (s *ServiceV1) CreateWeather(ctx context.Context, weather *domains.Weather) error {
	// Валидация входных данных
	if weather == nil {
		return fmt.Errorf("погодные данные не могут быть nil")
	}
	if weather.StationID == "" {
		return fmt.Errorf("ID станции обязателен для создания записи о погоде")
	}

	// Вызов метода хранилища для создания записи о погоде
	err := s.storage.CreateWeather(ctx, weather)
	if err != nil {
		return fmt.Errorf("ошибка при создании записи о погоде для станции %s в сервисном слое: %w",
			weather.StationID, err)
	}

	return nil
}

// GetWeatherByPeriod возвращает записи о погоде за указанный период времени
func (s *ServiceV1) GetWeatherByPeriod(ctx context.Context, stationID string, from, to time.Time) ([]domains.Weather, error) {
	// Валидация входных данных
	if stationID == "" {
		return nil, fmt.Errorf("ID станции обязателен для получения записей о погоде")
	}

	// Проверка корректности временного периода
	if from.After(to) {
		return nil, fmt.Errorf("начальная дата (%s) не может быть позже конечной даты (%s)",
			from.Format("2006-01-02"), to.Format("2006-01-02"))
	}

	// Вызов метода хранилища для получения записей за период
	weatherList, err := s.storage.GetWeatherByPeriod(ctx, stationID, from, to)
	if err != nil {
		return nil, fmt.Errorf("ошибка при получении записей о погоде для станции %s за период %s - %s в сервисном слое: %w",
			stationID, from.Format("2006-01-02"), to.Format("2006-01-02"), err)
	}

	return weatherList, nil
}

// GetLatestWeather возвращает самую последнюю запись о погоде для указанной станции
func (s *ServiceV1) GetLatestWeather(ctx context.Context, stationID string) (*domains.Weather, error) {
	// Валидация входных данных
	if stationID == "" {
		return nil, fmt.Errorf("ID станции обязателен для получения последней записи о погоде")
	}

	// Вызов метода хранилища для получения последней записи
	w, err := s.storage.GetLatestWeather(ctx, stationID)
	if err != nil {
		return nil, fmt.Errorf("ошибка при получении последней записи о погоде для станции %s в сервисном слое: %w",
			stationID, err)
	}

	return w, nil
}

// GetWeatherStats возвращает статистические данные о погоде за указанный период
func (s *ServiceV1) GetWeatherStats(ctx context.Context, stationID string, from, to time.Time) (*domains.WeatherStats, error) {
	// Валидация входных данных
	if stationID == "" {
		return nil, fmt.Errorf("ID станции обязателен для получения статистики о погоде")
	}

	// Проверка корректности временного периода
	if from.After(to) {
		return nil, fmt.Errorf("начальная дата (%s) не может быть позже конечной даты (%s)",
			from.Format("2006-01-02"), to.Format("2006-01-02"))
	}

	// Вызов метода хранилища для получения статистики
	stats, err := s.storage.GetWeatherStats(ctx, stationID, from, to)
	if err != nil {
		return nil, fmt.Errorf("ошибка при получении статистики о погоде для станции %s за период %s - %s в сервисном слое: %w",
			stationID, from.Format("2006-01-02"), to.Format("2006-01-02"), err)
	}

	return stats, nil
}
