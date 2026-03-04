.PHONY: help generate-ssh-keys ssh-copy bootstrap-servers-ssh bootstrap-servers run-app full-execute

help:
	@echo "Доступные команды:"
	@echo ""
	@echo "  Команды для настройки SSH доступа:"
	@echo "  make generate-ssh-keys      - Генерация SSH ключей для доступа к серверам"
	@echo "  make ssh-copy               - Копирование публичных ключей на серверы"
	@echo ""
	@echo "  Команды для начальной настройки серверов:"
	@echo "  make bootstrap-servers-ssh  - Полная настройка серверов (генерация ключей + копирование + установка ПО)"
	@echo "  make bootstrap-servers      - Настройка серверов (без генерации ключей, используются существующие)"
	@echo ""
	@echo "  Команды для управления приложением:"
	@echo "  make run-app                 - Запуск приложения на настроенных серверах"
	@echo "  make full-execute            - Полный цикл: настройка серверов + запуск приложения"

# Генерация SSH ключей для доступа к серверам
# Запускает скрипт keygen.sh, который создает пару ключей (публичный/приватный)
generate-ssh-keys: scripts/keygen.sh
	chmod +x scripts/keygen.sh
	./scripts/keygen.sh
	@echo "✅ SSH ключи сгенерированы."

# Копирование публичных ключей на удаленные серверы
# Использует ssh_copy.sh для копирования ключей на серверы из .env файла
ssh-copy: scripts/ssh_copy.sh scripts/.env
	chmod +x scripts/ssh_copy.sh
	./scripts/ssh_copy.sh
	@echo "✅ Публичные ключи скопированы на серверы."

# Полная настройка серверов с генерацией новых ключей
# Выполняет: генерацию ключей -> копирование -> базовую настройку через Ansible
bootstrap-servers-ssh: ./playbooks/bootstrap.yml
	make generate-ssh-keys
	make ssh-copy
	ansible-playbook ./playbooks/bootstrap.yml --tags first-setup && \
	ansible-playbook ./playbooks/bootstrap.yml --tags install && \
	ansible-playbook ./playbooks/install-basics.yml
	@echo "✅ Серверы настроены (с генерацией ключей)."

# Настройка серверов с существующими ключами
# Предполагает, что ключи уже сгенерированы и скопированы
bootstrap-servers: ./playbooks/bootstrap.yml
	ansible-playbook ./playbooks/bootstrap.yml --tags first-setup && \
	ansible-playbook ./playbooks/bootstrap.yml --tags install && \
	ansible-playbook ./playbooks/install-basics.yml
	@echo "✅ Серверы настроены (использованы существующие ключи)."

# Запуск приложения на настроенных серверах
# Выполняет Ansible плейбук для деплоя и запуска приложения
run-app:
	ansible-playbook ./playbooks/run-app.yml
	@echo "✅ Приложение запущено на серверах."

# Полный цикл развертывания
# Выполняет настройку серверов и запуск приложения одной командой
full-execute:
	make bootstrap-servers
	make run-app
	@echo "✅ Полный цикл развертывания завершен."