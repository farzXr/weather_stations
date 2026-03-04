package http

import "net/http"

func (t *TransportHttp) Home(w http.ResponseWriter, r *http.Request) {
	front, err := t.loadFrontendFiles(w, "templates/index.html", "index.css", "index.js")
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	data := map[string]interface{}{
		"js":  front.jsName,
		"css": front.cssName,
	}

	front.tmpl.Execute(w, data)
}

func (t *TransportHttp) Station(w http.ResponseWriter, r *http.Request) {
	front, err := t.loadFrontendFiles(w, "templates/station.html", "station.css", "station.js")
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	data := map[string]interface{}{
		"js":  front.jsName,
		"css": front.cssName,
	}

	front.tmpl.Execute(w, data)
}

func (t *TransportHttp) StationCreate(w http.ResponseWriter, r *http.Request) {
	front, err := t.loadFrontendFiles(w, "templates/create.html", "create.css", "create.js")
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	data := map[string]interface{}{
		"js":  front.jsName,
		"css": front.cssName,
	}

	front.tmpl.Execute(w, data)
}

func (t *TransportHttp) StationEdit(w http.ResponseWriter, r *http.Request) {
	front, err := t.loadFrontendFiles(w, "templates/edit.html", "edit.css", "edit.js")
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	data := map[string]interface{}{
		"js":  front.jsName,
		"css": front.cssName,
	}

	front.tmpl.Execute(w, data)
}
