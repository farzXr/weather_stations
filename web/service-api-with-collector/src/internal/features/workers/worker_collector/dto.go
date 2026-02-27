package workercollector

import (
	"fmt"
	"time"
)

// Status представляет структуру данных для отправки статуса работы сборщика
// во внешнее API для логирования и мониторинга
type Status struct {
	// Comment содержит текстовое описание результата операции
	// Например: "Успешно" или "Ошибка: connection refused"
	Comment string `json:"comment"`

	// Code содержит HTTP статус код или код ошибки в строковом формате
	// Например: "200", "404", "500"
	Code string `json:"code"`

	// CreatedAt содержит временную метку создания статуса
	// Используется для отслеживания времени возникновения события
	CreatedAt time.Time `json:"created_at"`
}

func NewStatus(err error, code string) Status {
	comment := "Успешно"
	if err != nil {
		comment = fmt.Sprintf("Ошибка: %s", err.Error())
	}
	return Status{
		Comment:   comment,
		Code:      code,
		CreatedAt: time.Now(),
	}
}
