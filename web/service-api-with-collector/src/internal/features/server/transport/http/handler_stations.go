package http

import (
	"fmt"
	"net/http"

	"github.com/farzXr/weatherStation/internal/core/domains"
)

// CreateStation обрабатывает HTTP запрос на создание новой метеостанции
func (t *TransportHttp) CreateStation(w http.ResponseWriter, r *http.Request) {
	var station domains.Station

	if err := decodeAndValidate(r, &station); err != nil {
		respondWithError(w, http.StatusBadRequest, "Ошибка при декодировании JSON: "+err.Error())
		return
	}

	if station.Name == "" {
		respondWithError(w, http.StatusBadRequest, "Название станции обязательно для заполнения")
		return
	}

	created, err := t.service.CreateStation(r.Context(), &station)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Ошибка при создании станции: "+err.Error())
		return
	}

	respondWithJSON(w, http.StatusCreated, created)
}

// GetStations обрабатывает HTTP запрос на получение списка всех метеостанций
func (t *TransportHttp) GetStations(w http.ResponseWriter, r *http.Request) {
	stations, err := t.service.GetStations(r.Context())
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Ошибка при получении списка станций: "+err.Error())
		return
	}

	// Проверка на пустой список
	if len(stations) == 0 {
		respondWithJSON(w, http.StatusOK, []domains.Station{})
		return
	}

	respondWithJSON(w, http.StatusOK, stations)
}

// GetStation обрабатывает HTTP запрос на получение информации о конкретной метеостанции
func (t *TransportHttp) GetStation(w http.ResponseWriter, r *http.Request) {
	// Получаем все query-параметры
	queryParams := r.URL.Query()

	// Получаем конкретный параметр "id" (первое значение)
	stationID := queryParams.Get("id")

	if stationID == "" || stationID == "/" {
		respondWithError(w, http.StatusBadRequest, "ID станции не указан в URL")
		return
	}

	station, err := t.service.GetStation(r.Context(), stationID)
	if err != nil {
		respondWithError(w, http.StatusNotFound, fmt.Sprintf("Станция с ID '%s' не найдена", stationID))
		return
	}

	respondWithJSON(w, http.StatusOK, station)
}

// EditStation обрабатывает HTTP запрос на редактирование метеостанции
func (t *TransportHttp) EditStation(w http.ResponseWriter, r *http.Request) {
	var station domains.Station

	if err := decodeAndValidate(r, &station); err != nil {
		respondWithError(w, http.StatusBadRequest, "Ошибка при декодировании JSON: "+err.Error())
		return
	}

	if station.ID == "" {
		respondWithError(w, http.StatusBadRequest, "ID станции обязателен для редактирования")
		return
	}

	stationData, err := t.service.EditStation(r.Context(), &station)
	if err != nil {
		respondWithError(w, http.StatusNotFound, fmt.Sprintf("Станция с ID '%s' не найдена", station.ID))
		return
	}

	respondWithJSON(w, http.StatusOK, stationData)
}

// DeleteStation обрабатывает HTTP запрос на удаление метеостанции
func (t *TransportHttp) DeleteStation(w http.ResponseWriter, r *http.Request) {
	var station domains.Station

	if err := decodeAndValidate(r, &station); err != nil {
		respondWithError(w, http.StatusBadRequest, "Ошибка при декодировании JSON: "+err.Error())
		return
	}

	if station.ID == "" {
		respondWithError(w, http.StatusBadRequest, "ID станции обязателен для удаления")
		return
	}

	stationData, err := t.service.DeleteStation(r.Context(), &station)
	if err != nil {
		respondWithError(w, http.StatusNotFound, fmt.Sprintf("Станция с ID '%s' не найдена", station.ID))
		return
	}

	respondWithJSON(w, http.StatusOK, stationData)
}
