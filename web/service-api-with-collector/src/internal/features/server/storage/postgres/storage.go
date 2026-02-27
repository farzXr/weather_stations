package postgres

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// StoragePostgres представляет хранилище данных PostgreSQL с пулом соединений
type StoragePostgres struct {
	Pool    *pgxpool.Pool
	strConn string
}

// NewStoragePostgres создает новый экземпляр хранилища PostgreSQL
func NewStoragePostgres() *StoragePostgres {
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

	// Формирование строки подключения к базе данных
	strConn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s", dbUser, dbPassword, dbHost, dbPort, dbName)

	return &StoragePostgres{
		strConn: strConn,
	}
}

// Init инициализирует подключение к PostgreSQL и настраивает пул соединений
func (s *StoragePostgres) Init() error {
	// Парсинг строки подключения
	config, err := pgxpool.ParseConfig(s.strConn)
	if err != nil {
		return fmt.Errorf("ошибка при парсинге строки подключения к PostgreSQL: %w", err)
	}

	// Настройка пула соединений
	config.MaxConns = 50                       // максимум соединений
	config.MinConns = 10                       // минимум соединений
	config.MaxConnLifetime = 1 * time.Hour     // максимальное время жизни соединения
	config.MaxConnIdleTime = 30 * time.Minute  // максимальное время бездействия
	config.HealthCheckPeriod = 1 * time.Minute // период проверки здоровья

	// Дополнительные настройки
	config.ConnConfig.ConnectTimeout = 5 * time.Second

	// Создание пула соединений с конфигурацией
	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return fmt.Errorf("ошибка при создании пула соединений PostgreSQL: %w", err)
	}

	// Проверка подключения с таймаутом
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return fmt.Errorf("ошибка при проверке подключения к PostgreSQL (ping): %w", err)
	}

	s.Pool = pool
	log.Println("Успешное подключение к PostgreSQL с пулом соединений")

	return nil
}

// Close закрывает пул соединений с PostgreSQL
func (s *StoragePostgres) Close() {
	if s.Pool != nil {
		s.Pool.Close()
		log.Println("Пул соединений PostgreSQL закрыт")
	}
}
