import { API_BASE_URL } from '../constants/config';
import { correctForServer } from '../utils/dateUtils';

export async function fetchLatestWeather(stationId) {
    const response = await fetch(`${API_BASE_URL}/weather/latest`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'SectionID': stationId
        }
    });
    
    if (!response.ok) throw new Error(`HTTP ошибка! Статус: ${response.status}`);
    return await response.json();
}

export async function fetchWeatherByPeriod(stationId, from, to) {
    // Корректируем даты для сервера
    const correctedFrom = correctForServer(new Date(from));
    const correctedTo = correctForServer(new Date(to));
    
    const response = await fetch(`${API_BASE_URL}/weather/period`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ station_id: stationId, from: correctedFrom, to: correctedTo })
    });
    
    if (!response.ok) throw new Error(`HTTP ошибка! Статус: ${response.status}`);
    return await response.json();
}

export async function fetchWeatherStats(stationId, from, to) {
    const correctedFrom = correctForServer(new Date(from));
    const correctedTo = correctForServer(new Date(to));
    
    const response = await fetch(`${API_BASE_URL}/weather/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ station_id: stationId, from: correctedFrom, to: correctedTo })
    });
    
    if (!response.ok) throw new Error(`HTTP ошибка! Статус: ${response.status}`);
    return await response.json();
}