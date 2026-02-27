package di

import (
	"log"

	"github.com/farzXr/weatherStation/internal/core/utils"
	"github.com/farzXr/weatherStation/internal/features/server/storage"
	workercollector "github.com/farzXr/weatherStation/internal/features/workers/worker_collector"
)

// WorkersCollector содержит зависимости для работы сборщиков метеостанций
type WorkersCollector struct {
	Pool *workercollector.Pool // Пул воркеров для сбора данных со всех станций
}

// NewWorkersCollector создаёт и инициализирует новый экземпляр сборщика воркеров
func NewWorkersCollector(storage storage.StorageQueryExecutor) *WorkersCollector {
	// Парсинг конфигурации из переменных окружения и флагов командной строки
	configPool, err := utils.ParseFlagsAndENVforWorkersConfig()
	if err != nil {
		log.Fatalf("Ошибка парсинга конфига worker-pool: %s", err)
	}

	log.Printf("Интервал опроса: %v", configPool.PollInterval)

	// Создание пула воркеров с полученной конфигурацией
	collectors := workercollector.NewPool(configPool, storage)

	// Проверка, что пул успешно создан
	if collectors == nil {
		log.Panicf("Не удалось создать сборщик данных для станций")
	}

	// Возвращаем структуру с инициализированным пулом
	return &WorkersCollector{
		Pool: collectors,
	}
}
