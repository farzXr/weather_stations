// response.go
package http

import (
	"encoding/json"
	"net/http"
	"text/template"
)

// Используется для передачи данных между обработчиками и шаблонами
type FrontFiles struct {
	// tmpl - парсированный HTML шаблон для рендеринга страницы
	tmpl *template.Template

	// jsName - имя JavaScript файла из манифеста (например, "main.abc123.js")
	jsName string

	// cssName - имя CSS файла из манифеста (например, "main.abc123.css")
	cssName string

	// cssName - dev/prod (если dev, то обновляем кеш шаблонов каждый раз)
	stage string
}

// respondWithJSON отправляет JSON-ответ с указанным статусом
func respondWithJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// respondWithError отправляет JSON-ответ с ошибкой
func respondWithError(w http.ResponseWriter, status int, message string) {
	respondWithJSON(w, status, map[string]string{
		"error": message,
	})
}

// decodeAndValidate декодирует JSON и возвращает ошибку при необходимости
func decodeAndValidate(r *http.Request, v interface{}) error {
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(v)
}

// loadFrontendFiles загружает HTML шаблон и имена CSS/JS файлов из манифеста
func (t *TransportHttp) loadFrontendFiles(w http.ResponseWriter, html, css, js string) (*FrontFiles, error) {
	var front FrontFiles

	tmpl, err := template.ParseFiles(html)
	if err != nil {
		http.Error(w, "Ошибка загрузки шаблона: "+err.Error(), http.StatusInternalServerError)
		return nil, err
	}
	front.tmpl = tmpl

	indexJS, err := t.manifestFrontend.Get(js)
	if err != nil {
		http.Error(w, "Ошибка получения JS файла: "+err.Error(), http.StatusInternalServerError)
		return nil, err
	}
	front.jsName = indexJS

	indexCSS, err := t.manifestFrontend.Get(css)
	if err != nil {
		http.Error(w, "Ошибка получения CSS файла: "+err.Error(), http.StatusInternalServerError)
		return nil, err
	}
	front.cssName = indexCSS

	return &front, nil
}
