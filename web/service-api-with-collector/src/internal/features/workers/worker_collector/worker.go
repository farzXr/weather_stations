package workercollector

import (
	"net/http"
	"sync"

	"github.com/farzXr/weatherStation/internal/core/configs"
	"github.com/farzXr/weatherStation/internal/features/server/storage"
)

// Collector представляет сборщик данных с метеостанции
type Collector struct {
	config     configs.ConfigWorkerCollector // Конфигурация сборщика
	httpClient *http.Client                  // HTTP клиент для выполнения запросов
	stopChan   chan struct{}                 // Канал для ручной остановки сборщика
	wg         *sync.WaitGroup
	storage    storage.StorageQueryExecutor
}

// NewCollector создает новый экземпляр сборщика данных
func NewCollector(config configs.ConfigWorkerCollector, wg *sync.WaitGroup, storage storage.StorageQueryExecutor) *Collector {

	return &Collector{
		config:     config,
		httpClient: &http.Client{Timeout: config.Timeout},
		stopChan:   make(chan struct{}),
		wg:         wg,
		storage:    storage,
	}
}
