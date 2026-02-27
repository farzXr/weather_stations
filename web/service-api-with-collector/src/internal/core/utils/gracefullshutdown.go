package utils

import (
	"context"
	"os"
	"os/signal"
	"syscall"
)

// GracefulShutdown ожидает сигнал завершения программы и вызывает функцию отмены контекста
// Используется для корректного завершения работы приложения (graceful shutdown)
func GracefulShutdown(cancel context.CancelFunc) {
	// Создание канала для получения системных сигналов
	// Буферизированный канал размером 1, чтобы не пропустить сигнал
	stop := make(chan os.Signal, 1)

	// Регистрация канала для получения указанных сигналов
	// SIGTERM - сигнал завершения (kill)
	// SIGINT - сигнал прерывания (Ctrl+C)
	signal.Notify(stop, syscall.SIGTERM, syscall.SIGINT)

	// Блокировка выполнения до получения сигнала
	// Горутина будет ожидать здесь, пока не придет сигнал
	<-stop

	// Вызов функции отмены контекста при получении сигнала
	// Это инициирует graceful shutdown всех компонентов приложения
	cancel()
}
