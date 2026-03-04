.PHONY: help build run run-mock stop migrate test-api test-full remove remove-app remove-db build-frontend watch-frontend stop-watch-frontend

help:
	@echo "Доступные команды:"
	@echo "  make build      	  - Первый запуск: сборка и запуск всех сервисов с миграциями"
	@echo "  make run        	  - Повторный запуск: только основные сервисы (app, db)"
	@echo "  make run-mock   	  - Запуск с мок-серверами для тестирования"
	@echo "  make stop       	  - Остановка всех контейнеров"
	@echo "  make remove     	  - Остановка и удаление всех контейнеров"
	@echo "  make remove-app 	  - Остановка и удаление app контейнера"
	@echo "  make remove-db  	  - Остановка и удаление db контейнера"
	@echo "  make migrate    	  - Запуск только сервиса миграций"
	@echo "  make test-api   	  - Запуск тестов (приложение уже должно быть запущено)"
	@echo "  make test-full  	  - Полный цикл: сборка + моки + тесты + остановка"
	@echo "  make build-frontend   - Запуск сборки frontend с помощью webpack"
	@echo "  make watch-frontend   - Запуск frontend в режиме автопересборки (для dev)"
	@echo "  make stop-watch-frontend - Остановка режима автопересборки frontend"

# Первый запуск: сборка + миграции + запуск
build: docker-compose.yml
	docker compose up -d --build
	make build-frontend
	@echo "✅ Проект собран и запущен. Миграции выполнены."

# Повторный запуск (без пересборки и миграций)
run: docker-compose.yml
	docker compose up -d db
	docker compose up -d app
	@echo "✅ Сервисы запущены."

# Запуск с мок-серверами
run-mock: docker-compose.yml docker-compose.mock-servers.yml
	docker compose -f docker-compose.yml -f docker-compose.mock-servers.yml up -d --build
	@echo "✅ Мок-серверы и основные сервисы запущены."

# Остановка всех контейнеров
stop: docker-compose.yml docker-compose.mock-servers.yml
	docker compose -f docker-compose.yml -f docker-compose.mock-servers.yml stop
	@echo "✅ Все контейнеры остановлены."

# Удаление всех контейнеров
remove: docker-compose.yml docker-compose.mock-servers.yml
	docker compose -f docker-compose.yml -f docker-compose.mock-servers.yml down
	@echo "✅ Все контейнеры остановлены и удалены."

# Удаление контейнера app
remove-app: docker-compose.yml
	docker compose down app
	@echo "✅ Контейнер app остановлен и удалён."

# Удаление контейнера db
remove-db: docker-compose.yml  # ← БЫЛО remove-app, ИСПРАВЛЕНО на remove-db
	docker compose down db
	@echo "✅ Контейнер db остановлен и удалён."

# Запуск только миграций
migrate: docker-compose.yml
	docker compose up -d db
	docker compose up -d migration
	@echo "✅ Миграции выполнены."

# Запуск тестов (приложение должно быть запущено)
test-api: ./scripts/test_api.sh
	@echo "🔄 Запуск тестов..."
	./scripts/test_api.sh
	@echo "✅ Тесты завершены."

# Полный цикл: сборка + моки + тесты + остановка
test-full: docker-compose.yml docker-compose.mock-servers.yml ./scripts/test_api.sh
	@echo "🔄 Запуск полного тестового цикла..."
	make migrate
	make run-mock
	@echo "⏳ Ожидание 30 секунд перед тестами..."
	sleep 30
	./scripts/test_api.sh
	@echo "⏳ Ожидание 60 секунд перед остановкой..."
	sleep 60
	docker compose -f docker-compose.yml -f docker-compose.mock-servers.yml down
	@echo "✅ Полный тестовый цикл завершен."

# Собрать фронтенд один раз
build-frontend:
	docker compose --profile build up -d --build frontend-build
	@echo "✅ Фронт собран."

# Запустить в режиме разработки (с автопересборкой фронтенда)
watch-frontend:
	docker compose --profile dev up -d frontend-watch
	@echo "✅ Запущен режим автопересборки фронта."

# Остановка режима автопересборки frontend
stop-watch-frontend:
	docker compose --profile dev stop frontend-watch
	@echo "✅ Остановлен режим автопересборки фронта."