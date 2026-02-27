package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"log"

	"github.com/farzXr/weatherStation/internal/core/domains"
)

// CreateStation создает новую метеостанцию в базе данных
func (s *StoragePostgres) CreateStation(ctx context.Context, station *domains.Station) (*domains.Station, error) {
	query := `
	INSERT INTO stations (name, location, url)
	VALUES($1, $2, $3)
	RETURNING id, name, location, url, created_at
	`

	// Выполнение запроса на вставку и получение созданной записи
	err := s.Pool.QueryRow(ctx, query,
		station.Name,
		station.Location,
		station.Url,
	).Scan(
		&station.ID,
		&station.Name,
		&station.Location,
		&station.Url,
		&station.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("ошибка при создании станции '%s' в локации '%s': %w",
			station.Name, station.Location, err)
	}

	return station, nil
}

// GetStations возвращает список всех метеостанций
func (s *StoragePostgres) GetStations(ctx context.Context) ([]domains.Station, error) {
	var stations []domains.Station

	query := `
	SELECT id, name, location, url, created_at, updated_at
	FROM stations
	ORDER BY name
	`

	// Выполнение запроса на получение всех станций
	rows, err := s.Pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("ошибка при получении списка станций: %w", err)
	}
	defer rows.Close()

	// Итерация по полученным строкам
	for rows.Next() {
		var station domains.Station
		err := rows.Scan(
			&station.ID,
			&station.Name,
			&station.Location,
			&station.Url,
			&station.CreatedAt,
			&station.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("ошибка при сканировании данных станции: %w", err)
		}
		stations = append(stations, station)
	}

	// Проверка на ошибки после завершения итерации
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("ошибка при обработке результатов запроса списка станций: %w", err)
	}

	// Если станций нет, возвращаем пустой слайс (не nil) для удобства использования
	if stations == nil {
		stations = make([]domains.Station, 0)
		log.Println("БД: Станции отсутствуют")
	}

	return stations, nil
}

// GetStation возвращает информацию о конкретной метеостанции по её ID
func (s *StoragePostgres) GetStation(ctx context.Context, stationID string) (*domains.Station, error) {
	var station domains.Station

	query := `
	SELECT id, name, location, url, created_at, updated_at
	FROM stations
	WHERE id = $1
	`

	// Выполнение запроса на получение станции по ID
	err := s.Pool.QueryRow(ctx, query, stationID).Scan(
		&station.ID,
		&station.Name,
		&station.Location,
		&station.Url,
		&station.CreatedAt,
		&station.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("станция с ID '%s' не найдена: %w", stationID, err)
		}
		return nil, fmt.Errorf("ошибка при получении станции с ID '%s': %w", stationID, err)
	}

	return &station, nil
}

// EditStation обновляет информацию о метеостанции по её ID
func (s *StoragePostgres) EditStation(ctx context.Context, updatedData *domains.Station) (*domains.Station, error) {
	var station domains.Station

	query := `
	UPDATE stations
	SET 
		name = COALESCE($2, name),
		location = COALESCE($3, location),
		url = COALESCE($4, url),
		updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'GMT+4'
	WHERE id = $1
	RETURNING id, name, location, url, created_at, updated_at
	`

	// Выполнение запроса на обновление станции
	err := s.Pool.QueryRow(ctx, query,
		updatedData.ID,
		updatedData.Name,
		updatedData.Location,
		updatedData.Url,
	).Scan(
		&station.ID,
		&station.Name,
		&station.Location,
		&station.Url,
		&station.CreatedAt,
		&station.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("станция с ID '%s' не найдена для обновления", updatedData.ID)
		}
		return nil, fmt.Errorf("ошибка при обновлении станции с ID '%s': %w", updatedData.ID, err)
	}

	return &station, nil
}

// DeleteStation удаляет метеостанцию по её ID
func (s *StoragePostgres) DeleteStation(ctx context.Context, stationID string) error {
	query := `
	DELETE FROM stations
	WHERE id = $1
	`

	// Выполнение запроса на удаление станции
	result, err := s.Pool.Exec(ctx, query, stationID)
	if err != nil {
		return fmt.Errorf("ошибка при удалении станции с ID '%s': %w", stationID, err)
	}

	// Проверка, была ли удалена какая-либо строка
	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("станция с ID '%s' не найдена", stationID)
	}

	log.Printf("Станция с ID '%s' успешно удалена", stationID)
	return nil
}
