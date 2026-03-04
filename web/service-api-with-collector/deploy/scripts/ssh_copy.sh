#!/bin/bash

if [ -f scripts/.env ]; then
    source scripts/.env
else
    echo "Файл .env не найден!"
    exit 1
fi

read -p "Сколько серверов? (по умолчанию 1): " COUNT
COUNT=${COUNT:-1}

for ((i=1; i<=$COUNT; i++)); do
    SERVER="SSH_SERVER_${i}"
    SERVER_VALUE=${!SERVER}
    
    # Если есть сервер - работаем
    if [ -n "$SERVER_VALUE" ]; then
        echo "Сервер $i: root@$SERVER_VALUE"
        
        # Запрашиваем пароль
        read -s -p "Введите пароль для root@$SERVER_VALUE: " PASSWORD_VALUE
        echo
        
        echo "Копируем ключ..."
        sleep 5
        sshpass -p "$PASSWORD_VALUE" ssh-copy-id -i ssh/root_id_rsa root@$SERVER_VALUE
        ssh-keyscan -H "$SERVER_VALUE" >> ~/.ssh/known_hosts
        echo "Готово!"
        echo
    else
        echo "Пропускаем сервер $i - нет данных сервера"
        echo
    fi
done