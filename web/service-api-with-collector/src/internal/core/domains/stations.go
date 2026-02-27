package domains

import (
	"time"
)

// Station представляет доменную модель метеостанции
// Содержит основную информацию о станции сбора погодных данных
type Station struct {
	// ID - уникальный идентификатор станции (UUID)
	// Генерируется автоматически при создании
	ID string `json:"id" db:"id"`

	// Name - название метеостанции
	// Обязательное поле для заполнения
	// Пример: "Метеостанция Северная", "Weather Station 001"
	Name string `json:"name" db:"name" binding:"required"`

	// Location - географическое расположение станции
	// Необязательное поле, может содержать адрес или координаты
	// Пример: "г. Москва, ул. Ленина, д. 1" или "55.7558° N, 37.6176° E"
	Location string `json:"location" db:"location"`

	// Url - эндпоинт для получения данных с метеостанции
	// Обязательное поле для заполнения
	// Пример: "http://weather-station-001.local/data"
	Url string `json:"url" db:"url" binding:"required"`

	// CreatedAt - дата и время создания записи о станции
	// Устанавливается автоматически базой данных
	CreatedAt time.Time `json:"created_at" db:"created_at"`

	// UpdatedAt - дата и время последнего обновления записи
	// Обновляется автоматически при изменении данных
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}
