package domains

import "time"

// Weather представляет доменную модель записи о погоде
// Содержит данные измерений с метеостанции в конкретный момент времени
type Weather struct {
	// ID - уникальный идентификатор записи (UUID)
	// Генерируется автоматически при сохранении
	ID string `json:"id" db:"id"`

	// StationID - идентификатор метеостанции, с которой получены данные
	// Обязательное поле, связывает запись с конкретной станцией
	// Пример: "8f5cdcd7-00a8-4634-a5df-35c2b218a9eb"
	StationID string `json:"station_id" db:"station_id" binding:"required"`

	// Temperature - температура воздуха в градусах Цельсия (°C)
	// Обязательное поле, может быть отрицательным
	// Пример: 23.5, -5.0, 15.7
	Temperature float64 `json:"temperature" db:"temperature" binding:"required"`

	// Humidity - относительная влажность воздуха в процентах (%)
	// Обязательное поле, допустимый диапазон: 0-100%
	// Пример: 45.5, 78.0, 100.0
	Humidity float64 `json:"humidity" db:"humidity" binding:"required,min=0,max=100"`

	// Pressure - атмосферное давление в гектопаскалях (гПа)
	// Обязательное поле, допустимый диапазон: 700-1200 гПа
	// Стандартное давление: 1013.25 гПа
	// Пример: 1012.3, 998.5, 1025.0
	Pressure float64 `json:"pressure" db:"pressure" binding:"required,min=700,max=1200"`

	// RecordedAt - временная метка создания записи
	// Устанавливается автоматически при сохранении в базу данных
	// Формат: RFC3339 (2024-01-02T15:04:05Z)
	RecordedAt time.Time `json:"created_at" db:"created_at"`
}
