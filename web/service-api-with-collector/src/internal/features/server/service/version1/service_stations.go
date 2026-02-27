package version1

import (
	"context"
	"fmt"
	"log"

	"github.com/farzXr/weatherStation/internal/core/domains"
)

// CreateStation создает новую метеостанцию
func (s *ServiceV1) CreateStation(ctx context.Context, station *domains.Station) (*domains.Station, error) {
	// Валидация входных данных
	if station.Name == "" {
		return nil, fmt.Errorf("название станции обязательно для заполнения")
	}

	// Вызов метода хранилища для создания станции
	created, err := s.storage.CreateStation(ctx, station)
	if err != nil {
		return nil, fmt.Errorf("ошибка при создании станции '%s' в сервисном слое: %w",
			station.Name, err)
	}

	log.Println("Добавлена станция => запуск станции ", station.ID)
	s.pollWorkersCOllector.StartOne(s.ctxMain, station)

	return created, nil
}

// GetStations возвращает список всех метеостанций
func (s *ServiceV1) GetStations(ctx context.Context) ([]domains.Station, error) {
	// Вызов метода хранилища для получения списка станций
	stations, err := s.storage.GetStations(ctx)
	if err != nil {
		return nil, fmt.Errorf("ошибка при получении списка станций в сервисном слое: %w", err)
	}

	return stations, nil
}

// GetStation возвращает информацию о конкретной метеостанции по её ID
func (s *ServiceV1) GetStation(ctx context.Context, stationID string) (*domains.Station, error) {
	// Вызов метода хранилища для получения станции по ID
	station, err := s.storage.GetStation(ctx, stationID)
	if err != nil {
		return nil, fmt.Errorf("ошибка при получении станции с ID '%s' в сервисном слое: %w",
			stationID, err)
	}

	return station, nil
}

// EditStation редактирует информацию о конкретной метеостанции по её ID
func (s *ServiceV1) EditStation(ctx context.Context, station *domains.Station) (*domains.Station, error) {
	// Вызов метода хранилища для редактирования станции по ID
	station, err := s.storage.EditStation(ctx, station)

	if err != nil {
		return nil, fmt.Errorf("ошибка при редактировании станции с ID '%s' в сервисном слое: %w",
			station.ID, err)
	}

	log.Println("Станция изменена => перезапуск worker станции ", station.ID)
	s.pollWorkersCOllector.RestertOne(s.ctxMain, station)

	return station, nil
}

// DeleteStation удаляет конкретную метеостанции по её ID и останавливает worker
func (s *ServiceV1) DeleteStation(ctx context.Context, station *domains.Station) (*domains.Station, error) {
	// Вызов метода хранилища для редактирования станции по ID
	err := s.storage.DeleteStation(ctx, station.ID)

	if err != nil {
		return nil, fmt.Errorf("ошибка при удалении станции с ID '%s' в сервисном слое: %w",
			station.ID, err)
	}

	log.Println("Станция удалена => остановка worker станции ", station.ID)
	s.pollWorkersCOllector.StopOne(s.ctxMain, station)

	return station, nil
}
