package http

import "time"

// GetWeatherByPeriod представляет DTO (Data Transfer Object) для запроса погодных данных за период
type GetWeatherByPeriod struct {
	// StationID - уникальный идентификатор метеостанции (UUID)
	// Обязательное поле, определяет, с какой станции нужны данные
	StationID string `json:"station_id"`

	// From - начальная дата и время периода
	// Формат: RFC3339 (например, "2024-01-02T15:04:05Z")
	From time.Time `json:"from"`

	// To - конечная дата и время периода
	// Формат: RFC3339 (например, "2024-01-02T15:04:05Z")
	To time.Time `json:"to"`
}
