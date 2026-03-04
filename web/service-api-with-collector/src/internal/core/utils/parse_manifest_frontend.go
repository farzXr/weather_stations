package utils

import (
	"encoding/json"
	"fmt"
	"os"
)

// Manifest хранит соответствие логических имен файлов реальным путям
type Manifest struct {
	// map[string]string - это типа "ключ": "значение"
	// Например: "index.js": "/static/dist/js/index.dbaa5b5a6a04200d37cd.js"
	data map[string]string
	// путь к файлу манифеста
	path string
}

// NewManifest создает новый объект для работы с манифестом
func NewManifest(manifestPath string) *Manifest {
	return &Manifest{
		path: manifestPath,
		data: make(map[string]string),
	}
}

func (m *Manifest) load() error {
	var err error

	fmt.Println("Загружаем манифест из:", m.path)

	// Читаем файл
	var fileData []byte
	fileData, err = os.ReadFile(m.path)
	if err != nil {
		err = fmt.Errorf("не могу прочитать файл манифеста: %w", err)
		return err
	}

	// Парсим JSON в map
	err = json.Unmarshal(fileData, &m.data)
	if err != nil {
		err = fmt.Errorf("не могу распарсить JSON: %w", err)
		return err
	}

	fmt.Printf("Загружено %d записей из манифеста\n", len(m.data))

	return err
}

// Get возвращает путь к файлу по его логическому имени
// Например: Get("index.js") вернет "/static/dist/js/index.dbaa5b5a6a04200d37cd.js"
func (m *Manifest) Get(name string) (string, error) {
	// Загружаем манифест (если еще не загружен)
	if err := m.load(); err != nil {
		return "", err
	}

	// Ищем файл в мапе
	path, exists := m.data[name]
	if !exists {
		return "", fmt.Errorf("файл '%s' не найден в манифесте", name)
	}

	return path, nil
}
