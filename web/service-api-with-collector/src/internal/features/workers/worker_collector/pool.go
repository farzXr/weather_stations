package workercollector

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/farzXr/weatherStation/internal/core/configs"
	"github.com/farzXr/weatherStation/internal/core/domains"
	"github.com/farzXr/weatherStation/internal/features/server/storage"
)

// Pool представляет пул воркеров для сбора данных с метеостанций.
// Он управляет списком станций и соответствующими воркерами.
type Pool struct {
	config      *configs.ConfigPoolWorkesrCollector // Конфигурация пула (URL, таймауты и т.д.)
	client      *http.Client                        // HTTP-клиент для выполнения запросов к API
	stationList []domains.Station                   // Список станций, полученный из API
	workers     map[string]*Collector               // Карта воркеров, где ключ — название станции
	storage     storage.StorageQueryExecutor
	wg          *sync.WaitGroup
}

// NewPool создаёт и инициализирует новый пул воркеров.
// Принимает конфигурацию пула и возвращает указатель на созданный Pool.
func NewPool(config *configs.ConfigPoolWorkesrCollector, storage storage.StorageQueryExecutor) *Pool {
	return &Pool{
		config:  config,
		client:  &http.Client{},              // Инициализация HTTP-клиента с настройками по умолчанию
		workers: make(map[string]*Collector), // Инициализация пустой карты для воркеров
		storage: storage,
		wg:      &sync.WaitGroup{},
	}
}

// Init выполняет начальную инициализацию пула: получает список всех станций.
// Возвращает ошибку, если не удалось получить список станций.
func (p *Pool) Init() error {
	list, err := p.storage.GetStations(context.Background())
	if err != nil {
		return fmt.Errorf("Не удалось получить список станций: %s", err)
	}

	if len(list) == 0 {
		log.Println("Станции отсутствуют - опрашивать нечего")
		return nil
	}
	// Сохранение полученного списка в пуле
	p.stationList = list

	return nil
}

// Start запускает всех воркеров для каждой станции из списка.
// Каждый воркер работает в своей горутине. Метод блокируется до завершения всех воркеров.
// Принимает контекст для возможности graceful shutdown.
func (p *Pool) Start(ctx context.Context) {
	log.Println("Инициализация воркеров для сбора метрик...")
	// Инициализация пула worker-collector
	log.Println("Настройка пула worker-collector...")
	if err := p.Init(); err != nil {
		log.Fatalf("Критическая ошибка при инициализации пула worker-collector: %v", err)
	}
	log.Println("Пулл worker-collector настроен")

	// WaitGroup для ожидания завершения всех воркеров
	p.wg.Add(len(p.stationList)) // Устанавливаем счётчик равным количеству станций

	// Перебор всех станций из списка
	for _, v := range p.stationList {
		// Создание конфигурации для конкретного воркера на основе общей конфигурации пула
		cfg := configs.ConfigWorkerCollector{
			ConfigPoolWorkesrCollector: *p.config, // Копируем базовые настройки
		}

		// Установка специфичных для станции параметров
		cfg.StationID = v.ID   // ID станции
		cfg.StationURL = v.Url // URL для сбора данных со станции

		// Создание нового воркера для станции
		worker := NewCollector(cfg, p.wg, p.storage)

		// Сохранение воркера в карту пула (ключ — название станции)
		p.workers[v.ID] = worker

		// Запуск воркера в отдельной горутине
		go worker.Start(ctx)
	}

	// Ожидание завершения всех запущенных воркеров
	p.wg.Wait()
}

func (p *Pool) Stop() {
	for key, worker := range p.workers {
		worker.Stop()
		log.Printf("Worker %s - остановлен\n", key)
	}
}

func (p *Pool) StartOne(ctx context.Context, station *domains.Station) {
	cfg := configs.ConfigWorkerCollector{
		ConfigPoolWorkesrCollector: *p.config, // Копируем базовые настройки
	}

	// Установка специфичных для станции параметров
	cfg.StationID = station.ID   // ID станции
	cfg.StationURL = station.Url // URL для сбора данных со станции

	// Создание нового воркера для станции
	worker := NewCollector(cfg, p.wg, p.storage)

	// Сохранение воркера в карту пула (ключ — название станции)
	p.workers[station.ID] = worker

	p.wg.Add(1)
	// Запуск воркера в отдельной горутине
	go worker.Start(ctx)
}

func (p *Pool) RestertOne(ctx context.Context, station *domains.Station) {
	worker, exist := p.workers[station.ID]
	if exist {
		worker.Stop()
	} else {
		fmt.Printf("Такой воркер не найден - %s ", station.ID)
	}

	p.StartOne(ctx, station)
}

func (p *Pool) StopOne(ctx context.Context, station *domains.Station) {
	worker, exist := p.workers[station.ID]
	if exist {
		worker.Stop()
	} else {
		fmt.Printf("Такой воркер не найден - %s ", station.ID)
	}
}
