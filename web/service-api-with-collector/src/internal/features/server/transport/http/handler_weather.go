package http

import (
	"net/http"
)

// GetWeatherByPeriod обрабатывает HTTP запрос на получение записей о погоде за период
func (t *TransportHttp) GetWeatherByPeriod(w http.ResponseWriter, r *http.Request) {
	var dto GetWeatherByPeriod

	if err := decodeAndValidate(r, &dto); err != nil {
		respondWithError(w, http.StatusBadRequest, "Ошибка при декодировании JSON: "+err.Error())
		return
	}

	if dto.StationID == "" {
		respondWithError(w, http.StatusBadRequest, "Поле StationID обязательно для заполнения")
		return
	}

	weatherList, err := t.service.GetWeatherByPeriod(r.Context(), dto.StationID, dto.From, dto.To)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Ошибка при получении записей о погоде: "+err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, weatherList)
}

// GetLatestWeather обрабатывает HTTP запрос на получение последней записи о погоде
func (t *TransportHttp) GetLatestWeather(w http.ResponseWriter, r *http.Request) {
	stationID := r.Header.Get("SectionID")

	if stationID == "" {
		respondWithError(w, http.StatusBadRequest, "Отсутствует обязательный заголовок SectionID")
		return
	}

	wData, err := t.service.GetLatestWeather(r.Context(), stationID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Ошибка при получении последней записи о погоде: "+err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, wData)
}

// GetWeatherStats обрабатывает HTTP запрос на получение статистики о погоде за период
func (t *TransportHttp) GetWeatherStats(w http.ResponseWriter, r *http.Request) {
	var dto GetWeatherByPeriod

	if err := decodeAndValidate(r, &dto); err != nil {
		respondWithError(w, http.StatusBadRequest, "Ошибка при декодировании JSON: "+err.Error())
		return
	}

	if dto.StationID == "" {
		respondWithError(w, http.StatusBadRequest, "Поле StationID обязательно для заполнения")
		return
	}

	stat, err := t.service.GetWeatherStats(r.Context(), dto.StationID, dto.From, dto.To)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Ошибка при получении статистики о погоде: "+err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, stat)
}
