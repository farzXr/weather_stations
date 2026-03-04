import { API_BASE_URL } from '../constants/config';

// Базовые функции для работы со станциями
export async function fetchStationsList() {
    const response = await fetch(`${API_BASE_URL}/stations/list`);
    if (!response.ok) throw new Error(`HTTP ошибка! Статус: ${response.status}`);
    return await response.json();
}

export async function fetchStationById(id) {
    const response = await fetch(`${API_BASE_URL}/stations?id=${encodeURIComponent(id)}`);
    if (!response.ok) throw new Error(`HTTP ошибка! Статус: ${response.status}`);
    return await response.json();
}

export async function createStation(stationData) {
    const response = await fetch(`${API_BASE_URL}/stations/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(stationData)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ошибка! Статус: ${response.status}`);
    }
    return await response.json();
}

export async function updateStation(stationData) {
    const response = await fetch(`${API_BASE_URL}/stations/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(stationData)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ошибка! Статус: ${response.status}`);
    }
    return await response.json();
}

export async function deleteStation(stationData) {
    const response = await fetch(`${API_BASE_URL}/stations/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(stationData)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ошибка! Статус: ${response.status}`);
    }
    return await response.json();
}