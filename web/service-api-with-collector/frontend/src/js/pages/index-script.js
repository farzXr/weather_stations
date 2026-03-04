import '../../styles/index-style.css';
import { API_BASE_URL, APP_BASE_URL } from '../constants/config';
import { formatDate } from '../utils/dateUtils';
import { isValidUrl } from '../utils/validationUtils';
import { showNotification } from '../utils/uiUtils';
import { fetchStationsList, deleteStation } from '../api/stationsApi';

// Функция отображения станций
function displayStations(stations) {
    const container = document.getElementById('stationsContainer');
    if (!stations || stations.length === 0) {
        container.innerHTML = '<div class="no-stations">📭 Нет доступных станций</div>';
        return;
    }
    
    const stationsHTML = stations.map(station => {
        const hasName = station.name && station.name.trim() !== '';
        const displayId = station.id ? station.id.substring(0, 8) + '...' : 'Нет ID';
        const location = station.location || 'Не указана';
        const url = station.url || 'Не указан';
        const createdDate = formatDate(station.created_at);
        const updatedDate = formatDate(station.updated_at);
        
        return `
            <div class="station-card" data-station-id="${station.id || ''}">
                <div class="station-header">
                    <span class="station-name ${!hasName ? 'empty' : ''}" title="${station.name || 'Без названия'}">
                        ${hasName ? station.name : 'Без названия'}
                    </span>
                    <span class="station-id" title="ID станции: ${station.id || 'Нет ID'}">
                        ${displayId}
                    </span>
                </div>
                <div class="station-details">
                    <div class="detail-item">
                        <span class="detail-icon">📍</span>
                        <span class="detail-label">Локация:</span>
                        <span class="detail-value" title="${location}">${location}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">🔗</span>
                        <span class="detail-label">URL:</span>
                        <span class="detail-value url" title="${url}" onclick="window.open('${url}', '_blank')">
                            ${url.length > 30 ? url.substring(0, 30) + '...' : url}
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">📅</span>
                        <span class="detail-label">Создана:</span>
                        <span class="detail-value" title="${station.created_at || ''}">${createdDate}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">🔄</span>
                        <span class="detail-label">Обновлена:</span>
                        <span class="detail-value" title="${station.updated_at || ''}">${updatedDate}</span>
                    </div>
                </div>
                <div class="station-actions">
                    <button class="btn-action btn-view" onclick="viewStation('${station.id || ''}')" title="Просмотреть станцию">👁️</button>
                    <button class="btn-action btn-edit" onclick="editStation('${station.id || ''}')" title="Редактировать станцию">✏️</button>
                    <button class="btn-action btn-delete" onclick="handleDelete('${station.id || ''}')" title="Удалить станцию">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `<div class="stations-grid">${stationsHTML}</div>`;
    document.getElementById('timestamp').textContent = `Последнее обновление: ${new Date().toLocaleString('ru-RU')}`;
}

// Обработчик удаления
async function handleDelete(stationId) {
    if (!stationId) return;
    if (!confirm('Вы уверены, что хотите удалить эту станцию?')) return;
    
    try {
        await deleteStation({ id: stationId });
        showNotification('Станция успешно удалена', 'success');
        await loadStations();
    } catch (error) {
        showNotification(`Ошибка при удалении: ${error.message}`, 'error');
    }
}

// Загрузка данных
async function loadStations() {
    const container = document.getElementById('stationsContainer');
    try {
        container.innerHTML = '<div class="loading">⏳ Загрузка станций...</div>';
        const data = await fetchStationsList();
        displayStations(data);
    } catch (error) {
        container.innerHTML = `
            <div class="error">
                ❌ Ошибка загрузки данных: ${error.message}
                <br><br>
                <small>Проверьте подключение к серверу (${API_BASE_URL})</small>
            </div>
        `;
    }
}

// Навигационные функции
window.viewStation = (id) => window.open(`${APP_BASE_URL}/station?id=${id}`, '_blank');
window.editStation = (id) => window.location.href = `${APP_BASE_URL}/station/edit?id=${id}`;
window.addNewStation = () => window.location.href = `${APP_BASE_URL}/station/create`;
window.handleDelete = handleDelete;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadStations();
    window.loadStations = loadStations;
});