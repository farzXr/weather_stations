#!/bin/sh

DB_URL="postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=disable"
echo "DB_URL: $DB_URL"

echo "Running migrations..."
migrate -path /migrations -database "$DB_URL" up