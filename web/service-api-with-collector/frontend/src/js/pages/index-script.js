/**
 * ФАЙЛ: index-script.js
 * Скрипт для главной страницы со списком всех станций
 * Отвечает за загрузку, отображение и удаление станций
 */

import '../../styles/index-style.css';
import { API_BASE_URL, APP_BASE_URL } from '../constants/config';
import { formatDate } from '../utils/dateUtils';
import { isValidUrl } from '../utils/validationUtils';
import { showNotification } from '../utils/uiUtils';
import { fetchStationsList, deleteStation } from '../api/stationsApi';

/**
 * ОТОБРАЖЕНИЕ СПИСКА СТАНЦИЙ
 * Генерирует HTML-карточки для каждой станции и вставляет их на страницу
 * @param {Array} stations - Массив объектов станций с сервера
 */
function displayStations(stations) {
    const container = document.getElementById('stationsContainer');
    
    // Если станций нет, показываем заглушку
    if (!stations || stations.length === 0) {
        container.innerHTML = '<div class="no-stations">📭 Нет доступных станций</div>';
        return;
    }
    
    // Для каждой станции создаём HTML-карточку
    const stationsHTML = stations.map(station => {
        // Подготавливаем данные для отображения (с защитой от отсутствующих значений)
        const hasName = station.name && station.name.trim() !== '';
        const displayId = station.id ? station.id.substring(0, 8) + '...' : 'Нет ID';
        const location = station.location || 'Не указана';
        const url = station.url || 'Не указан';
        const createdDate = formatDate(station.created_at);
        const updatedDate = formatDate(station.updated_at);
        
        // Генерируем HTML для одной карточки
        return `
            <div class="station-card" data-station-id="${station.id || ''}">
                <!-- Шапка карточки: название и ID станции -->
                <div class="station-header">
                    <span class="station-name ${!hasName ? 'empty' : ''}" title="${station.name || 'Без названия'}">
                        ${hasName ? station.name : 'Без названия'}
                    </span>
                    <span class="station-id" title="ID станции: ${station.id || 'Нет ID'}">
                        ${displayId}
                    </span>
                </div>
                
                <!-- Детальная информация о станции -->
                <div class="station-details">
                    <!-- Локация -->
                    <div class="detail-item">
                        <span class="detail-icon">📍</span>
                        <span class="detail-label">Локация:</span>
                        <span class="detail-value" title="${location}">${location}</span>
                    </div>
                    
                    <!-- URL (кликабельный) -->
                    <div class="detail-item">
                        <span class="detail-icon">🔗</span>
                        <span class="detail-label">URL:</span>
                        <span class="detail-value url" title="${url}" onclick="window.open('${url}', '_blank')">
                            ${url.length > 30 ? url.substring(0, 30) + '...' : url}
                        </span>
                    </div>
                    
                    <!-- Дата создания -->
                    <div class="detail-item">
                        <span class="detail-icon">📅</span>
                        <span class="detail-label">Создана:</span>
                        <span class="detail-value" title="${station.created_at || ''}">${createdDate}</span>
                    </div>
                    
                    <!-- Дата обновления -->
                    <div class="detail-item">
                        <span class="detail-icon">🔄</span>
                        <span class="detail-label">Обновлена:</span>
                        <span class="detail-value" title="${station.updated_at || ''}">${updatedDate}</span>
                    </div>
                </div>
                
                <!-- Кнопки действий с каждой станцией -->
                <div class="station-actions">
                    <button class="btn-action btn-view" onclick="viewStation('${station.id || ''}')" title="Просмотреть станцию">👁️</button>
                    <button class="btn-action btn-edit" onclick="editStation('${station.id || ''}')" title="Редактировать станцию">✏️</button>
                    <button class="btn-action btn-delete" onclick="handleDelete('${station.id || ''}')" title="Удалить станцию">🗑️</button>
                </div>
            </div>
        `;
    }).join(''); // Склеиваем все карточки в одну строку
    
    // Вставляем все карточки на страницу в сетку
    container.innerHTML = `<div class="stations-grid">${stationsHTML}</div>`;
    
    // Обновляем метку времени последнего обновления
    document.getElementById('timestamp').textContent = `Последнее обновление: ${new Date().toLocaleString('ru-RU')}`;
}

/**
 * ОБРАБОТЧИК УДАЛЕНИЯ СТАНЦИИ
 * Запрашивает подтверждение, удаляет станцию и обновляет список
 * @param {string} stationId - ID станции для удаления
 */
async function handleDelete(stationId) {
    if (!stationId) return; // Нечего удалять
    
    // Подтверждение у пользователя
    if (!confirm('Вы уверены, что хотите удалить эту станцию?')) return;
    
    try {
        await deleteStation({ id: stationId });
        showNotification('Станция успешно удалена', 'success');
        await loadStations(); // Перезагружаем список
    } catch (error) {
        showNotification(`Ошибка при удалении: ${error.message}`, 'error');
    }
}

/**
 * ЗАГРУЗКА СПИСКА СТАНЦИЙ С СЕРВЕРА
 * Показывает индикатор загрузки, получает данные и отображает их
 */
async function loadStations() {
    const container = document.getElementById('stationsContainer');
    
    try {
        // Показываем индикатор загрузки
        container.innerHTML = '<div class="loading">⏳ Загрузка станций...</div>';
        
        // Запрашиваем данные с сервера
        const data = await fetchStationsList();
        
        // Отображаем полученные станции
        displayStations(data);
    } catch (error) {
        // В случае ошибки показываем сообщение с ссылкой на настройки сервера
        container.innerHTML = `
            <div class="error">
                ❌ Ошибка загрузки данных: ${error.message}
                <br><br>
                <small>Проверьте подключение к серверу (${API_BASE_URL})</small>
            </div>
        `;
    }
}

/**
 * НАВИГАЦИОННЫЕ ФУНКЦИИ
 * Привязываем к глобальному объекту window для вызова из HTML (onclick)
 */
window.viewStation = (id) => window.open(`${APP_BASE_URL}/station?id=${id}`, '_blank');  // Просмотр в новой вкладке
window.editStation = (id) => window.location.href = `${APP_BASE_URL}/station/edit?id=${id}`;  // Редактирование
window.addNewStation = () => window.location.href = `${APP_BASE_URL}/station/create`;  // Создание новой
window.handleDelete = handleDelete;  // Удаление (делегируем функции выше)

/**
 * ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
 * Загружаем список станций и делаем функцию loadStations глобально доступной
 */
document.addEventListener('DOMContentLoaded', () => {
    loadStations(); // Первоначальная загрузка
    window.loadStations = loadStations; // Для возможности перезагрузки вручную
});