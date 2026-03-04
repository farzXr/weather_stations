/**
 * ФАЙЛ: edit-script.js
 * Скрипт для страницы редактирования станции
 * Отвечает за загрузку данных станции, валидацию формы, сохранение изменений и удаление
 */

import '../../styles/edit-style.css';
import { API_BASE_URL, APP_BASE_URL } from '../constants/config';
import { formatDate } from '../utils/dateUtils';
import { validateStationName, validateLocation, validateUrl } from '../utils/validationUtils';
import { showNotification, setButtonLoading, setProgressBar, showError } from '../utils/uiUtils';
import { fetchStationById, updateStation, deleteStation } from '../api/stationsApi';

// ==================== СОСТОЯНИЕ ПРИЛОЖЕНИЯ ====================

/** Текущий объект станции, загруженный с сервера */
let currentStation = null;

/** Оригинальные данные до изменений (для отслеживания изменений) */
let originalData = null;


// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Извлекает ID станции из URL-параметров
 * @returns {string|null} ID станции или null, если параметр отсутствует
 */
function getStationIdFromUrl() {
    return new URLSearchParams(window.location.search).get('id');
}

/**
 * Загружает данные станции с сервера по ID из URL
 * Отображает форму редактирования после загрузки
 */
async function loadStationData() {
    const stationId = getStationIdFromUrl();
    
    if (!stationId) {
        showError(document.querySelector('.container'), 'ID станции не указан в URL');
        return;
    }

    try {
        const station = await fetchStationById(stationId);
        currentStation = station;
        
        // Сохраняем исходные данные для отслеживания изменений
        originalData = {
            name: station.name,
            location: station.location,
            url: station.url
        };
        
        displayStationData(station);
    } catch (error) {
        showError(document.querySelector('.container'), error.message);
    }
}

/**
 * Отображает данные станции в форме редактирования
 * @param {Object} station - Объект станции с сервера
 */
function displayStationData(station) {
    // Переключаем видимость: скрываем загрузку, показываем форму
    document.getElementById('loadingContainer').style.display = 'none';
    document.getElementById('editFormContainer').style.display = 'block';
    
    // Заполняем мета-информацию
    document.getElementById('stationIdBadge').textContent = `ID: ${station.id}`;
    document.getElementById('metaId').textContent = station.id;
    document.getElementById('metaCreated').textContent = formatDate(station.created_at);
    document.getElementById('metaUpdated').textContent = formatDate(station.updated_at);
    
    // Заполняем поля формы
    document.getElementById('name').value = station.name || '';
    document.getElementById('location').value = station.location || '';
    document.getElementById('url').value = station.url || '';
    
    // Для модального окна удаления
    document.getElementById('deleteStationName').textContent = station.name || 'без названия';
}

/**
 * Валидация всей формы
 * Проверяет все поля и показывает ошибки
 * @returns {boolean} true если форма валидна, false если есть ошибки
 */
function validateForm() {
    let isValid = true;
    
    // Скрываем предыдущие ошибки
    document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('input').forEach(el => el.classList.remove('error'));
    
    // Валидация названия
    const nameResult = validateStationName(document.getElementById('name').value);
    if (!nameResult.isValid) {
        showFieldError('name', nameResult.message);
        isValid = false;
    }
    
    // Валидация локации
    const locationResult = validateLocation(document.getElementById('location').value);
    if (!locationResult.isValid) {
        showFieldError('location', locationResult.message);
        isValid = false;
    }
    
    // Валидация URL
    const urlResult = validateUrl(document.getElementById('url').value);
    if (!urlResult.isValid) {
        showFieldError('url', urlResult.message);
        isValid = false;
    }
    
    return isValid;
}

/**
 * Показывает ошибку для конкретного поля
 * @param {string} fieldId - ID поля (name, location, url)
 * @param {string} message - Текст ошибки
 */
function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}Error`);
    
    input.classList.add('error');           // Подсвечиваем поле красным
    errorElement.textContent = message;     // Устанавливаем текст ошибки
    errorElement.classList.add('show');     // Показываем сообщение
}

/**
 * Проверяет, были ли изменения в форме
 * Сравнивает текущие значения полей с оригинальными
 * @returns {boolean} true если есть изменения
 */
function hasChanges() {
    const currentData = {
        name: document.getElementById('name').value.trim(),
        location: document.getElementById('location').value.trim(),
        url: document.getElementById('url').value.trim()
    };
    
    // Сравниваем через JSON, так как объекты нельзя сравнить напрямую
    return JSON.stringify(currentData) !== JSON.stringify(originalData);
}

/**
 * Сбрасывает форму до исходных значений
 */
function resetForm() {
    if (originalData) {
        // Восстанавливаем исходные значения
        document.getElementById('name').value = originalData.name || '';
        document.getElementById('location').value = originalData.location || '';
        document.getElementById('url').value = originalData.url || '';
        
        // Очищаем ошибки
        document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
        document.querySelectorAll('input').forEach(el => el.classList.remove('error'));
        
        showNotification('Изменения сброшены', 'info');
    }
}


// ==================== МОДАЛЬНОЕ ОКНО УДАЛЕНИЯ ====================

/**
 * Показывает модальное окно подтверждения удаления
 */
function showDeleteModal() {
    if (currentStation) {
        document.getElementById('deleteModal').classList.add('show');
    }
}

/**
 * Скрывает модальное окно подтверждения удаления
 */
function hideDeleteModal() {
    document.getElementById('deleteModal').classList.remove('show');
}


// ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================

/**
 * Обработчик отправки формы (сохранение изменений)
 */
document.getElementById('editStationForm').addEventListener('submit', async (e) => {
    e.preventDefault();  // Отменяем стандартную отправку формы
    
    // Валидация формы
    if (!validateForm()) {
        showNotification('Пожалуйста, исправьте ошибки в форме', 'error');
        return;
    }
    
    // Проверка, есть ли изменения
    if (!hasChanges()) {
        showNotification('Нет изменений для сохранения', 'info');
        return;
    }
    
    // Собираем данные из формы
    const stationData = {
        id: document.getElementById('stationIdBadge').textContent.replace('ID: ', '').trim(),
        name: document.getElementById('name').value.trim(),
        location: document.getElementById('location').value.trim(),
        url: document.getElementById('url').value.trim()
    };
    
    // Блокируем кнопку и показываем прогресс
    const submitBtn = document.getElementById('submitBtn');
    setButtonLoading(submitBtn, true, 'Сохранить изменения', 'Сохранение...');
    setProgressBar('progressBar', true);
    
    try {
        // Отправляем данные на сервер
        const result = await updateStation(stationData);
        
        // Обновляем оригинальные данные (теперь это новые исходные)
        originalData = { ...stationData };
        
        // Если сервер вернул новую дату обновления, показываем её
        if (result.updated_at) {
            document.getElementById('metaUpdated').textContent = formatDate(result.updated_at);
        }
        
        showNotification('Изменения успешно сохранены!', 'success');
    } catch (error) {
        showNotification(`Ошибка при сохранении: ${error.message}`, 'error');
    } finally {
        // Разблокируем кнопку и скрываем прогресс в любом случае
        setButtonLoading(submitBtn, false, '💾 Сохранить изменения', 'Сохранение...');
        setProgressBar('progressBar', false);
    }
});

/**
 * Обработчик подтверждения удаления станции
 */
document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    // Собираем данные станции для удаления
    const stationData = {
        id: document.getElementById('stationIdBadge').textContent.replace('ID: ', '').trim(),
        name: document.getElementById('name').value.trim(),
        location: document.getElementById('location').value.trim(),
        url: document.getElementById('url').value.trim()
    };
    
    hideDeleteModal();  // Закрываем модальное окно
    setProgressBar('progressBar', true);  // Показываем прогресс
    
    try {
        await deleteStation(stationData);
        showNotification('Станция успешно удалена!', 'success');
        
        // Перенаправляем на главную через 2 секунды
        setTimeout(() => {
            window.location.href = `${APP_BASE_URL}/home`;
        }, 2000);
    } catch (error) {
        showNotification(`Ошибка при удалении: ${error.message}`, 'error');
        setProgressBar('progressBar', false);  // Скрываем прогресс при ошибке
    }
});

/**
 * Валидация URL в реальном времени (при вводе)
 */
document.getElementById('url').addEventListener('input', function() {
    const result = validateUrl(this.value);
    const errorElement = document.getElementById('urlError');
    
    // Показываем ошибку только если поле не пустое и URL невалидный
    if (!result.isValid && this.value.trim()) {
        this.classList.add('error');
        errorElement.textContent = result.message;
        errorElement.classList.add('show');
    } else {
        // Убираем ошибку если поле пустое или URL валидный
        this.classList.remove('error');
        errorElement.classList.remove('show');
    }
});

/**
 * Предупреждение при попытке уйти со страницы с несохранёнными изменениями
 */
window.addEventListener('beforeunload', (e) => {
    if (hasChanges()) {
        e.preventDefault();
        e.returnValue = 'У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?';
    }
});


// ==================== ИНИЦИАЛИЗАЦИЯ ====================

document.addEventListener('DOMContentLoaded', () => {
    loadStationData();  // Загружаем данные станции
    
    // Добавляем обработчик для кнопки удаления
    const deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', showDeleteModal);
    }
});


// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================
// Делаем функции доступными для вызова из HTML (onclick)

window.resetForm = resetForm;              // Сброс формы
window.hideDeleteModal = hideDeleteModal;  // Закрыть модальное окно
window.showDeleteModal = showDeleteModal;  // Открыть модальное окно