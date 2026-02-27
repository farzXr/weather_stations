package utils

import (
	"flag"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/farzXr/weatherStation/internal/core/configs"
	"github.com/joho/godotenv"
)

// Парсинг файлов .env и флагов запуска
func ParseFlagsAndENVforWorkersConfig() (*configs.ConfigPoolWorkesrCollector, error) {
	var cfg configs.ConfigPoolWorkesrCollector

	if err := godotenv.Load(); err != nil {
		return nil, fmt.Errorf("Ошибка загрузки файла переменного окружения: %s", err)
	}

	// Получение значений из переменных окружения
	selfURLWeather := os.Getenv("SELF_URL_WEATHER")
	selfURLStations := os.Getenv("SELF_URL_STATIONS")
	loggingURL := os.Getenv("LOGGING_URL")
	pollInterval := os.Getenv("PULL_INTERVAL")
	timeout := os.Getenv("TIMEOUT")
	retryCount := os.Getenv("RETRY_COUNT")
	retryDelay := os.Getenv("RETRY_DELAY")

	// Определение флагов командной строки
	selfURLWeatherFlag := flag.String("self-w", "", "Endpoint записи показаний")
	selfURLStationsFlag := flag.String("self-s", "", "Endpoint получения списка станций")
	loggingURLFlag := flag.String("log", "", "Endpoint отправки успешности записи показаний")
	pollIntervalFlag := flag.Int("i", 0, "Частота обращений к погодной станции")
	timeoutFlag := flag.Int("t", 0, "Timeout обращения к погодной станции")
	retryCountFlag := flag.Int("r", 0, "Кол-во повторных обращений к погодной станции, в случаях неудачи")
	retryDelayFlag := flag.Int("rd", 0, "Временной интервал при повторных обращениях к погодной станции, в случаях неудачи")

	// Парсинг флагов командной строки
	flag.Parse()

	// Установка APIBaseURL (приоритет у флага командной строки)
	cfg.APIBaseURL = selfURLWeather
	if *selfURLWeatherFlag != "" {
		cfg.APIBaseURL = *selfURLWeatherFlag
	}

	// Установка APIBaseURLStations (приоритет у флага командной строки)
	cfg.APIBaseURLStations = selfURLStations
	if *selfURLStationsFlag != "" {
		cfg.APIBaseURLStations = *selfURLStationsFlag
	}

	// Установка APILoggingURL (приоритет у флага командной строки)
	cfg.APILoggingURL = loggingURL
	if *loggingURLFlag != "" {
		cfg.APILoggingURL = *loggingURLFlag
	}

	// Обработка PollInterval (интервал опроса)
	if pollInterval != "" {
		// Пробуем преобразовать строку из ENV в число
		if interval, err := strconv.Atoi(pollInterval); err == nil {
			cfg.PollInterval = time.Duration(interval) * time.Second
		}
	}
	// Флаг командной строки имеет приоритет (если значение не 0)
	if *pollIntervalFlag != 0 {
		cfg.PollInterval = time.Duration(*pollIntervalFlag) * time.Second
	}

	// Обработка Timeout (таймаут запросов)
	if timeout != "" {
		if t, err := strconv.Atoi(timeout); err == nil {
			cfg.Timeout = time.Duration(t) * time.Second
		}
	}
	if *timeoutFlag != 0 {
		cfg.Timeout = time.Duration(*timeoutFlag) * time.Second
	}

	// Обработка RetryCount (количество повторов)
	if retryCount != "" {
		if rc, err := strconv.Atoi(retryCount); err == nil {
			cfg.RetryCount = rc
		}
	}
	if *retryCountFlag != 0 {
		cfg.RetryCount = *retryCountFlag
	}

	// Обработка RetryDelay (задержка между повторами)
	if retryDelay != "" {
		if rd, err := strconv.Atoi(retryDelay); err == nil {
			cfg.RetryDelay = time.Duration(rd) * time.Second
		}
	}
	if *retryDelayFlag != 0 {
		cfg.RetryDelay = time.Duration(*retryDelayFlag) * time.Second
	}

	// Установка значений по умолчанию, если параметры не были заданы
	if cfg.PollInterval == 0 {
		cfg.PollInterval = 10 * time.Second // по умолчанию 30 секунд
	}
	if cfg.Timeout == 0 {
		cfg.Timeout = 5 * time.Second // по умолчанию 10 секунд
	}
	if cfg.RetryCount == 0 {
		cfg.RetryCount = 1 // по умолчанию 3 попытки
	}
	if cfg.RetryDelay == 0 {
		cfg.RetryDelay = 5 * time.Second // по умолчанию 5 секунд
	}

	return &cfg, nil
}
