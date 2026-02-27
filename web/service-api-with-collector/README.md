# WeatherStation API With Collector

Сервис для сбора, хранения и анализа данных с метеостанций. Проект позволяет управлять станциями, получать от них показатели (температура, влажность, давление) через внешних воркеров, а также предоставляет HTTP API для работы с этими данными.

## 🛠 Технологический стек

| Компонент | Технология |
|-----------|------------|
| **Язык программирования** | Go 1.25+ |
| **База данных** | PostgreSQL |
| **Основные библиотеки** | Стандартная библиотека Go (net/http, context, database/sql) |
| **Миграции** | golang-migrate |
| **Среда запуска** | Docker / Docker Compose |

## 🏗 Архитектура системы

### Основные компоненты

1. **HTTP API Server** — основной сервер, обрабатывающий запросы к данным
2. **Worker Collector** — пул воркеров, которые по расписанию опрашивают внешние метеостанции и сохраняют данные через API
3. **PostgreSQL** — хранилище данных о станциях и погодных измерениях
4. **Mock-сервисы** — (для разработки/тестирования) имитируют работу внешних станций и сервисов логирования

## 📊 Доменные модели

### Station (Метеостанция)
Модель, представляющая метеостанцию.

```go
type Station struct {
    ID        string    `json:"id"`         // UUID станции
    Name      string    `json:"name"`       // Название (обязательно)
    Location  string    `json:"location"`   // Расположение (опционально)
    Url       string    `json:"url"`        // Эндпоинт для сбора данных (обязательно)
    CreatedAt time.Time `json:"created_at"` // Дата создания
    UpdatedAt time.Time `json:"updated_at"` // Дата обновления
}
```

### Weather (Погодное измерение)
Модель, представляющая показатели со станции в конкретный момент времени.

```go
type Weather struct {
    ID          string    `json:"id"`           // UUID записи
    StationID   string    `json:"station_id"`   // ID станции (обязательно)
    Temperature float64   `json:"temperature"`  // Температура (°C)
    Humidity    float64   `json:"humidity"`     // Влажность (%, 0-100)
    Pressure    float64   `json:"pressure"`     // Давление (гПа, 700-1200)
    RecordedAt  time.Time `json:"created_at"`   // Время измерения
}
```

### WeatherStats (Статистика)
Агрегированные данные по измерениям за период.

```go
type WeatherStats struct {
    ReadingsCount   int     `json:"readings_count"`    // Количество измерений
    AvgTemperature  float64 `json:"avg_temperature"`   // Средняя температура
    MinTemperature  float64 `json:"min_temperature"`   // Минимальная температура
    MaxTemperature  float64 `json:"max_temperature"`   // Максимальная температура
    AvgHumidity     float64 `json:"avg_humidity"`      // Средняя влажность
    AvgPressure     float64 `json:"avg_pressure"`      // Среднее давление
}
```

## 🌐 HTTP API

Все эндпоинты имеют базовый префикс `/api/v1`.

### Работа со станциями (Stations)

#### `POST /stations/create`
Создание новой метеостанции.

**Тело запроса:**
```json
{
    "name": "Название станции",
    "location": "Местоположение",
    "url": "http://example.com/api/data"
}
```

**Ответ:** `201 Created` с объектом созданной станции.

---

#### `GET /stations/list`
Получение списка всех станций.

**Ответ:** `200 OK` с массивом объектов `Station`.

---

#### `GET /stations/{id}`
Получение информации о конкретной станции по её ID.

**Ответ:** `200 OK` с объектом `Station`.

---

#### `POST /stations/edit`
Редактирование информации о станции.

**Тело запроса:**
```json
{
    "id": "uuid-станции",
    "name": "Новое название",
    "location": "Новое местоположение",
    "url": "Новый URL"
}
```
*Все поля опциональны, кроме `id`*

**Ответ:** `200 OK` с обновлённым объектом `Station`.

### Работа с погодными данными (Weather)

#### `POST /weather/`
Добавление новой записи о погоде (обычно используется воркерами).

**Тело запроса:**
```json
{
    "station_id": "uuid-станции",
    "temperature": 23.5,
    "humidity": 45.0,
    "pressure": 1012.3
}
```

**Ответ:** `201 Created` со статусом.

---

#### `POST /weather/period`
Получение списка записей за период.

**Тело запроса:**
```json
{
    "station_id": "uuid-станции",
    "from": "2024-01-01T00:00:00Z",
    "to": "2024-01-31T23:59:59Z"
}
```
*Время в формате RFC3339*

**Ответ:** `200 OK` с массивом объектов `Weather`.

---

#### `GET /weather/latest`
Получение последней записи для станции.

**Заголовок:**
```
SectionID: <UUID станции>
```

**Ответ:** `200 OK` с объектом `Weather`.

---

#### `POST /weather/stats`
Получение статистики за период.

**Тело запроса:**
```json
{
    "station_id": "uuid-станции",
    "from": "2024-01-01T00:00:00Z",
    "to": "2024-01-31T23:59:59Z"
}
```

**Ответ:** `200 OK` с объектом `WeatherStats`.

## 🚀 Запуск проекта

### Требования
- Docker
- Docker Compose

### Быстрый старт
```bash
# Клонирование репозитория
git clone <repository-url>
cd weatherstation_api-with-collector

# Запуск всех сервисов и миграций
make run
```

