#!/bin/bash

BASE_URL="http://localhost:8080/api/v1"
STATION_ID=""

# Простые разделители
SEPARATOR="========================================"

echo "$SEPARATOR"
echo "         ТЕСТИРОВАНИЕ API"
echo "$SEPARATOR"
echo ""

# 1. СОЗДАНИЕ СТАНЦИИ
echo ">>> 1. Создание станции"
RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Station TOTOT", "location":"bedroom", "url":"sdssdd"}' \
  $BASE_URL/stations/create)

# Выводим ответ и извлекаем ID станции
echo "$RESPONSE" | jq
STATION_ID=$(echo "$RESPONSE" | jq -r '.id')

if [ -z "$STATION_ID" ] || [ "$STATION_ID" = "null" ]; then
    echo "❌ Не удалось получить ID станции. Используется ID по умолчанию."
    STATION_ID="8f5cdcd7-00a8-4634-a5df-35c2b218a9eb"
else
    echo "✅ Получен ID станции: $STATION_ID"
fi
echo -e "\n$SEPARATOR\n"

# 1. СОЗДАНИЕ СТАНЦИИ
echo ">>> 1. Создание станции"
RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Station TOTOT", "location":"bedroom", "url":"sdssdd"}' \
  $BASE_URL/stations/create)

sleep 5

# 2. Изменение станции
echo ">>> 2. Изменение станции"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"$STATION_ID\", \"location\":\"Office\", \"url\":\"http://mock_server-metrics:8081/metric\"}" \
  $BASE_URL/stations/edit | jq
echo -e "\n$SEPARATOR\n"

# 1. СОЗДАНИЕ СТАНЦИИ
echo ">>> 1. Создание станции"
RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Station TOTOT", "location":"bedroom", "url":"sdssdd"}' \
  $BASE_URL/stations/create)

# Выводим ответ и извлекаем ID станции
echo "$RESPONSE" | jq
STATION_ID=$(echo "$RESPONSE" | jq -r '.id')

# 2. ВСЕ СТАНЦИИ
echo ">>> 2. Список всех станций"
curl -s $BASE_URL/stations/list | jq
echo -e "\n$SEPARATOR\n"

sleep 15

# 4. Удаление станции
echo ">>> 2. Удаление станции"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"$STATION_ID\", \"location\":\"Office\", \"url\":\"http://mock_server-metrics:8081/metric\"}" \
  $BASE_URL/stations/delete | jq
echo -e "\n$SEPARATOR\n"

# 3. СОЗДАНИЕ ИЗМЕРЕНИЯ
echo ">>> 3. Создание измерения"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"station_id\":\"$STATION_ID\", \"temperature\":24.23, \"humidity\":56, \"pressure\":800.34}" \
  $BASE_URL/weather/ | jq
echo -e "\n$SEPARATOR\n"

# 4. ПОСЛЕДНЕЕ ИЗМЕРЕНИЕ
echo ">>> 4. Последнее измерение"
curl -s -X POST -H "SectionID: $STATION_ID" $BASE_URL/weather/latest | jq
echo -e "\n$SEPARATOR\n"

# 5. ИЗМЕРЕНИЯ ЗА ПЕРИОД
echo ">>> 5. Измерения за период (24.02.2026)"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"station_id\": \"$STATION_ID\",
    \"from\": \"2026-02-24T00:00:00+04:00\",
    \"to\": \"2026-02-24T23:59:59+04:00\"
  }" \
  $BASE_URL/weather/period | jq
echo -e "\n$SEPARATOR\n"

# 6. СТАТИСТИКА
echo ">>> 6. Статистика за 24.02.2026"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"station_id\": \"$STATION_ID\",
    \"from\": \"2026-02-24T00:00:00+04:00\",
    \"to\": \"2026-02-24T23:59:59+04:00\"
  }" \
  $BASE_URL/weather/stats | jq
echo -e "\n$SEPARATOR\n"

echo "✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО"
echo "$SEPARATOR"