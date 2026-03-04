import { API_BASE_URL } from '../constants/config';

/**
 * ПОЛУЧЕНИЕ СПИСКА ВСЕХ СТАНЦИЙ
 * @returns {Promise<Array>} Массив объектов станций
 * @throws {Error} Если запрос не успешен
 */
export async function fetchStationsList() {
    // Отправляем GET запрос на получение списка станций
    const response = await fetch(`${API_BASE_URL}/stations/list`);
    
    // Если статус ответа не 200-299, выбрасываем ошибку
    if (!response.ok) throw new Error(`HTTP ошибка! Статус: ${response.status}`);
    
    // Парсим JSON ответ и возвращаем массив станций
    return await response.json();
}

/**
 * ПОЛУЧЕНИЕ ДАННЫХ КОНКРЕТНОЙ СТАНЦИИ ПО ID
 * @param {string} id - Идентификатор станции
 * @returns {Promise<Object>} Объект с данными станции
 * @throws {Error} Если запрос не успешен
 */
export async function fetchStationById(id) {
    // encodeURIComponent экранирует спецсимволы в ID для безопасной передачи в URL
    const response = await fetch(`${API_BASE_URL}/stations?id=${encodeURIComponent(id)}`);
    
    if (!response.ok) throw new Error(`HTTP ошибка! Статус: ${response.status}`);
    return await response.json();
}

/**
 * СОЗДАНИЕ НОВОЙ СТАНЦИИ
 * @param {Object} stationData - Данные новой станции {name, location, url}
 * @returns {Promise<Object>} Ответ от сервера (обычно созданная станция)
 * @throws {Error} Если запрос не успешен
 */
export async function createStation(stationData) {
    // Отправляем POST запрос с данными новой станции
    const response = await fetch(`${API_BASE_URL}/stations/create`, {
        method: 'POST',                          // HTTP метод
        headers: { 
            'Content-Type': 'application/json',  // Отправляем данные в JSON формате
            'Accept': 'application/json'         // Хотим получить ответ тоже в JSON
        },
        body: JSON.stringify(stationData)        // Превращаем объект в JSON строку
    });
    
    // Обработка ошибок с попыткой получить сообщение от сервера
    if (!response.ok) {
        // Пытаемся распарсить JSON с ошибкой, если не получается - пустой объект
        const errorData = await response.json().catch(() => ({}));
        // Используем сообщение сервера или общее сообщение об ошибке
        throw new Error(errorData.message || `HTTP ошибка! Статус: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * ОБНОВЛЕНИЕ СУЩЕСТВУЮЩЕЙ СТАНЦИИ
 * @param {Object} stationData - Обновлённые данные станции {id, name, location, url}
 * @returns {Promise<Object>} Ответ от сервера (обычно обновлённая станция)
 * @throws {Error} Если запрос не успешен
 */
export async function updateStation(stationData) {
    // Отправляем PUT запрос (обновление ресурса)
    const response = await fetch(`${API_BASE_URL}/stations/edit`, {
        method: 'PUT',                           // PUT означает "обновить существующее"
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(stationData)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ошибка! Статус: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * УДАЛЕНИЕ СТАНЦИИ
 * @param {Object} stationData - Данные для удаления {id} (и возможно name для подтверждения)
 * @returns {Promise<Object>} Ответ от сервера
 * @throws {Error} Если запрос не успешен
 */
export async function deleteStation(stationData) {
    // Отправляем POST запрос на удаление (хотя логичнее был бы DELETE, но тут POST)
    const response = await fetch(`${API_BASE_URL}/stations/delete`, {
        method: 'POST',                          // POST запрос с данными об удаляемой станции
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(stationData)        // Отправляем ID станции для удаления
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ошибка! Статус: ${response.status}`);
    }
    
    return await response.json();
}