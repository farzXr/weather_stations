package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/farzXr/weatherStation/internal/core/domains"
)

// CreateWeather добавляет новую запись о погоде в базу данных
func (s *StoragePostgres) CreateWeather(ctx context.Context, weather *domains.Weather) error {
	query := `
    INSERT INTO weather (station_id, temperature, humidity, pressure)
    VALUES($1, $2, $3, $4)
    RETURNING id, station_id, temperature, humidity, pressure, created_at
    `

	// Выполнение запроса на вставку и получение созданной записи
	err := s.Pool.QueryRow(ctx, query, weather.StationID, weather.Temperature, weather.Humidity, weather.Pressure).Scan(
		&weather.ID,
		&weather.StationID,
		&weather.Temperature,
		&weather.Humidity,
		&weather.Pressure,
		&weather.RecordedAt,
	)
	if err != nil {
		return fmt.Errorf("ошибка при создании записи о погоде для станции %s: %w", weather.StationID, err)
	}

	return nil
}

// GetWeatherByPeriod возвращает список записей о погоде за указанный период времени
func (s *StoragePostgres) GetWeatherByPeriod(ctx context.Context, stationID string, from, to time.Time) ([]domains.Weather, error) {
	var weatherList []domains.Weather

	query := `
	SELECT id, station_id, temperature, humidity, pressure, created_at
    FROM weather
    WHERE station_id = $1 
      AND created_at BETWEEN $2 AND $3
    ORDER BY created_at DESC
	`

	// Выполнение запроса на получение данных за период
	rows, err := s.Pool.Query(ctx, query, stationID, from, to)
	if err != nil {
		return nil, fmt.Errorf("ошибка при получении записей о погоде для станции %s за период %s - %s: %w",
			stationID, from.Format("2006-01-02"), to.Format("2006-01-02"), err)
	}
	defer rows.Close()

	// Итерация по полученным строкам
	for rows.Next() {
		var w domains.Weather
		err := rows.Scan(
			&w.ID, &w.StationID, &w.Temperature, &w.Humidity, &w.Pressure, &w.RecordedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("ошибка при сканировании строки результата для станции %s: %w", stationID, err)
		}

		weatherList = append(weatherList, w)
	}

	// Проверка на ошибки после завершения итерации
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("ошибка при обработке результатов запроса для станции %s: %w", stationID, err)
	}

	return weatherList, nil
}

// GetLatestWeather возвращает самую последнюю запись о погоде для указанной станции
func (s *StoragePostgres) GetLatestWeather(ctx context.Context, stationID string) (*domains.Weather, error) {
	var w domains.Weather
	query := `
	SELECT id, station_id, temperature, humidity, pressure, created_at
	FROM weather
	WHERE station_id = $1
	ORDER BY created_at DESC
	LIMIT 1
	`

	// Выполнение запроса на получение последней записи
	err := s.Pool.QueryRow(ctx, query, stationID).Scan(
		&w.ID,
		&w.StationID,
		&w.Temperature,
		&w.Humidity,
		&w.Pressure,
		&w.RecordedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("записи о погоде для станции %s не найдены: %w", stationID, err)
		}
		return nil, fmt.Errorf("ошибка при получении последней записи о погоде для станции %s: %w", stationID, err)
	}

	return &w, nil
}

// GetWeatherStats возвращает статистические данные о погоде за указанный период
func (s *StoragePostgres) GetWeatherStats(ctx context.Context, stationID string, from, to time.Time) (*domains.WeatherStats, error) {
	var stats domains.WeatherStats

	query := `
	SELECT
		COUNT(*) as readings_count,
		AVG(temperature) as avg_temperature,
		MIN(temperature) as min_temperature,
		MAX(temperature) as max_temperature,
		AVG(humidity) as avg_humidity,
		AVG(pressure) as avg_pressure
	FROM weather
	WHERE station_id = $1 AND created_at BETWEEN $2 AND $3
	`

	// Выполнение запроса на получение статистики
	err := s.Pool.QueryRow(ctx, query, stationID, from, to).Scan(
		&stats.ReadingsCount,
		&stats.AvgTemperature,
		&stats.MinTemperature,
		&stats.MaxTemperature,
		&stats.AvgHumidity,
		&stats.AvgPressure,
	)

	if err != nil {
		return nil, fmt.Errorf("ошибка при получении статистики для станции %s за период %s - %s: %w",
			stationID, from.Format("2006-01-02"), to.Format("2006-01-02"), err)
	}

	return &stats, nil
}
