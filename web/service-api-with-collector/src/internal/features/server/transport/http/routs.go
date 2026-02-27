package http

// Константы путей API
// Все пути построены на основе базового префикса /api/v1
const (
	// BaseAPIPath - базовый путь для всех API эндпоинтов версии 1
	// Добавляется ко всем маршрутам для версионирования API
	BaseAPIPath = "/api/v1"

	// Пути для работы с погодой
	// -----------------------------------------

	// WeatherPath - эндпоинт для создания новой записи о погоде
	// Метод: POST
	// Ожидает JSON с данными измерения в теле запроса
	WeatherPath = BaseAPIPath + "/weather/"

	// WeatherPeriodPath - эндпоинт для получения записей о погоде за указанный период
	// Метод: POST
	// Принимает JSON с station_id, from и to (временной период)
	WeatherPeriodPath = BaseAPIPath + "/weather/period"

	// WeatherLatestPath - эндпоинт для получения самой свежей записи о погоде для станции
	// Метод: POST
	// Требует заголовок SectionID с идентификатором станции
	WeatherLatestPath = BaseAPIPath + "/weather/latest"

	// WeatherStatsPath - эндпоинт для получения статистических данных о погоде за период
	// Метод: POST
	// Возвращает агрегированные данные (среднее, мин, макс) за указанный промежуток
	WeatherStatsPath = BaseAPIPath + "/weather/stats"

	// Пути для работы со станциями
	// -----------------------------------------

	// StationsCreate - эндпоинт для создания новой метеостанции
	// Метод: POST
	// Принимает JSON с name, location и url станции
	StationsCreate = BaseAPIPath + "/stations/create"

	// StationsList - эндпоинт для получения списка всех метеостанций
	// Метод: GET
	// Возвращает массив всех зарегистрированных станций
	StationsList = BaseAPIPath + "/stations/list"

	// StationByIDPath - эндпоинт для получения информации о конкретной станции по её ID
	// Метод: GET
	// ID станции передаётся в пути запроса (например, /stations?id=123)
	StationByIDPath = BaseAPIPath + "/stations"

	// StationEditByIDPath - эндпоинт для редактирования информации о станции
	// Метод: POST
	// Принимает JSON с обновлёнными данными станции (должен содержать ID)
	StationEditByIDPath = BaseAPIPath + "/stations/edit"

	// StationDeleteByIDPath - эндпоинт для удаления информации о станции
	// Метод: POST
	// Принимает JSON с данными станции (должен содержать ID)
	StationDeleteByIDPath = BaseAPIPath + "/stations/delete"
)
