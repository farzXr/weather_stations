import { API_BASE_URL } from '../constants/config';
import { correctForServer } from '../utils/dateUtils';

/**
 * ПОЛУЧЕНИЕ ПОСЛЕДНИХ ДАННЫХ ПОГОДЫ ДЛЯ СТАНЦИИ
 * @param {string} stationId - Идентификатор станции
 * @returns {Promise<Object>} Последние показания погоды
 * @throws {Error} Если запрос не успешен
 */
export async function fetchLatestWeather(stationId) {
    // Отправляем POST запрос с ID станции в заголовке (необычный способ, но работает)
    const response = await fetch(`${API_BASE_URL}/weather/latest`, {
        method: 'POST',                          // Используем POST (хотя логичнее был бы GET с параметром)
        headers: {
            'Content-Type': 'application/json',  // Тип отправляемых данных
            'Accept': 'application/json',        // Ожидаемый тип ответа
            'SectionID': stationId               // ID станции в заголовке (специфично для этого API)
        }
    });
    
    if (!response.ok) throw new Error(`HTTP ошибка! Статус: ${response.status}`);
    return await response.json();                 // Возвращаем распарсенные данные погоды
}

/**
 * ПОЛУЧЕНИЕ ДАННЫХ ПОГОДЫ ЗА УКАЗАННЫЙ ПЕРИОД
 * @param {string} stationId - Идентификатор станции
 * @param {string|Date} from - Начало периода
 * @param {string|Date} to - Конец периода
 * @returns {Promise<Array>} Массив показаний погоды за период
 * @throws {Error} Если запрос не успешен
 */
export async function fetchWeatherByPeriod(stationId, from, to) {
    // Корректируем даты для сервера (учитываем часовой пояс)
    // correctForServer преобразует локальное время в UTC или другой формат, понятный серверу
    const correctedFrom = correctForServer(new Date(from));
    const correctedTo = correctForServer(new Date(to));
    
    // Отправляем POST запрос с периодом в теле запроса
    const response = await fetch(`${API_BASE_URL}/weather/period`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',   // Отправляем JSON
            'Accept': 'application/json'          // Хотим получить JSON
        },
        // Формируем тело запроса: ID станции и период
        body: JSON.stringify({ 
            station_id: stationId,                 // ID станции в теле запроса
            from: correctedFrom,                    // Начало периода (скорректированное)
            to: correctedTo                          // Конец периода (скорректированное)
        })
    });
    
    if (!response.ok) throw new Error(`HTTP ошибка! Статус: ${response.status}`);
    return await response.json();                   // Возвращаем массив данных погоды
}

/**
 * ПОЛУЧЕНИЕ СТАТИСТИКИ ПОГОДЫ ЗА УКАЗАННЫЙ ПЕРИОД
 * @param {string} stationId - Идентификатор станции
 * @param {string|Date} from - Начало периода
 * @param {string|Date} to - Конец периода
 * @returns {Promise<Object>} Статистика (мин, макс, среднее и т.д.)
 * @throws {Error} Если запрос не успешен
 */
export async function fetchWeatherStats(stationId, from, to) {
    // Корректируем даты для сервера (та же логика, что и выше)
    const correctedFrom = correctForServer(new Date(from));
    const correctedTo = correctForServer(new Date(to));
    
    // Отправляем POST запрос на получение статистики
    const response = await fetch(`${API_BASE_URL}/weather/stats`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ 
            station_id: stationId, 
            from: correctedFrom, 
            to: correctedTo 
        })
    });
    
    if (!response.ok) throw new Error(`HTTP ошибка! Статус: ${response.status}`);
    return await response.json();                   // Возвращаем объект со статистикой
}