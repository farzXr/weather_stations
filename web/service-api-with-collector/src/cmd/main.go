package main

import (
	"context"
	"log"
	"sync"

	"github.com/farzXr/weatherStation/internal/core/di"
)

func main() {
	// Создание корневого контекста с функцией отмены
	// Этот контекст будет передан всем компонентам для graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel() // Гарантированный вызов cancel при завершении main

	// Инициализация зависимостей через DI контейнеры
	log.Println("Инициализация серверных компонентов...")
	s := di.NewServer(ctx)
	if err := s.Init(ctx); err != nil {
		log.Fatalf("Критическая ошибка при серверных компонентов: %v", err)
	}

	wg := sync.WaitGroup{}
	// Запускс всех компонентов сервера через DI контейнеры

	wg.Add(1)
	go func() {
		defer wg.Done()
		s.Start(ctx, cancel, &wg)
	}()

	wg.Wait()

	log.Println("Приложение успешно завершено")
}
