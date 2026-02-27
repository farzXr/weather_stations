package version1

import (
	"context"

	"github.com/farzXr/weatherStation/internal/features/server/storage"
	workercollector "github.com/farzXr/weatherStation/internal/features/workers/worker_collector"
)

// ServiceV1 представляет сервисный слой версии 1 для работы с метеостанциями и данными о погоде
type ServiceV1 struct {
	// storage - интерфейс для выполнения запросов к хранилищу данных
	storage              storage.StorageQueryExecutor
	pollWorkersCOllector *workercollector.Pool
	ctxMain              context.Context
}

// NewServiceV1 создает новый экземпляр сервиса версии 1
func NewServiceV1(storage storage.StorageQueryExecutor, pool *workercollector.Pool, ctx context.Context) *ServiceV1 {
	// Проверка на nil для предотвращения паники при использовании сервиса
	if storage == nil {
		return nil
	}

	return &ServiceV1{
		storage:              storage,
		pollWorkersCOllector: pool,
		ctxMain:              ctx,
	}
}
