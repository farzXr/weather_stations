// response.go
package http

import (
	"encoding/json"
	"net/http"
)

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
