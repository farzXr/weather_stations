import '../../styles/edit-style.css';
import { API_BASE_URL, APP_BASE_URL } from '../constants/config';
import { formatDate } from '../utils/dateUtils';
import { validateStationName, validateLocation, validateUrl } from '../utils/validationUtils';
import { showNotification, setButtonLoading, setProgressBar, showError } from '../utils/uiUtils';
import { fetchStationById, updateStation, deleteStation } from '../api/stationsApi';

let currentStation = null;
let originalData = null;

function getStationIdFromUrl() {
    return new URLSearchParams(window.location.search).get('id');
}

// Загрузка данных станции
async function loadStationData() {
    const stationId = getStationIdFromUrl();
    
    if (!stationId) {
        showError(document.querySelector('.container'), 'ID станции не указан в URL');
        return;
    }

    try {
        const station = await fetchStationById(stationId);
        currentStation = station;
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

// Отображение данных
function displayStationData(station) {
    document.getElementById('loadingContainer').style.display = 'none';
    document.getElementById('editFormContainer').style.display = 'block';
    
    document.getElementById('stationIdBadge').textContent = `ID: ${station.id}`;
    document.getElementById('metaId').textContent = station.id;
    document.getElementById('metaCreated').textContent = formatDate(station.created_at);
    document.getElementById('metaUpdated').textContent = formatDate(station.updated_at);
    
    document.getElementById('name').value = station.name || '';
    document.getElementById('location').value = station.location || '';
    document.getElementById('url').value = station.url || '';
    
    document.getElementById('deleteStationName').textContent = station.name || 'без названия';
}

// Валидация формы
function validateForm() {
    let isValid = true;
    
    document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('input').forEach(el => el.classList.remove('error'));
    
    const nameResult = validateStationName(document.getElementById('name').value);
    if (!nameResult.isValid) {
        showFieldError('name', nameResult.message);
        isValid = false;
    }
    
    const locationResult = validateLocation(document.getElementById('location').value);
    if (!locationResult.isValid) {
        showFieldError('location', locationResult.message);
        isValid = false;
    }
    
    const urlResult = validateUrl(document.getElementById('url').value);
    if (!urlResult.isValid) {
        showFieldError('url', urlResult.message);
        isValid = false;
    }
    
    return isValid;
}

function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}Error`);
    
    input.classList.add('error');
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

// Проверка изменений
function hasChanges() {
    const currentData = {
        name: document.getElementById('name').value.trim(),
        location: document.getElementById('location').value.trim(),
        url: document.getElementById('url').value.trim()
    };
    
    return JSON.stringify(currentData) !== JSON.stringify(originalData);
}

// Сброс формы
function resetForm() {
    if (originalData) {
        document.getElementById('name').value = originalData.name || '';
        document.getElementById('location').value = originalData.location || '';
        document.getElementById('url').value = originalData.url || '';
        
        document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
        document.querySelectorAll('input').forEach(el => el.classList.remove('error'));
        
        showNotification('Изменения сброшены', 'info');
    }
}

// Обработка сохранения
document.getElementById('editStationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
        showNotification('Пожалуйста, исправьте ошибки в форме', 'error');
        return;
    }
    
    if (!hasChanges()) {
        showNotification('Нет изменений для сохранения', 'info');
        return;
    }
    
    const stationData = {
        id: document.getElementById('stationIdBadge').textContent.replace('ID: ', '').trim(),
        name: document.getElementById('name').value.trim(),
        location: document.getElementById('location').value.trim(),
        url: document.getElementById('url').value.trim()
    };
    
    const submitBtn = document.getElementById('submitBtn');
    setButtonLoading(submitBtn, true, 'Сохранить изменения', 'Сохранение...');
    setProgressBar('progressBar', true);
    
    try {
        const result = await updateStation(stationData);
        
        originalData = { ...stationData };
        
        if (result.updated_at) {
            document.getElementById('metaUpdated').textContent = formatDate(result.updated_at);
        }
        
        showNotification('Изменения успешно сохранены!', 'success');
    } catch (error) {
        showNotification(`Ошибка при сохранении: ${error.message}`, 'error');
    } finally {
        setButtonLoading(submitBtn, false, '💾 Сохранить изменения', 'Сохранение...');
        setProgressBar('progressBar', false);
    }
});

// Модальное окно удаления
function showDeleteModal() {
    if (currentStation) {
        document.getElementById('deleteModal').classList.add('show');
    }
}

function hideDeleteModal() {
    document.getElementById('deleteModal').classList.remove('show');
}

// Обработка удаления
document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    const stationData = {
        id: document.getElementById('stationIdBadge').textContent.replace('ID: ', '').trim(),
        name: document.getElementById('name').value.trim(),
        location: document.getElementById('location').value.trim(),
        url: document.getElementById('url').value.trim()
    };
    
    hideDeleteModal();
    setProgressBar('progressBar', true);
    
    try {
        await deleteStation(stationData);
        showNotification('Станция успешно удалена!', 'success');
        
        setTimeout(() => {
            window.location.href = `${APP_BASE_URL}/home`;
        }, 2000);
    } catch (error) {
        showNotification(`Ошибка при удалении: ${error.message}`, 'error');
        setProgressBar('progressBar', false);
    }
});

// Валидация URL в реальном времени
document.getElementById('url').addEventListener('input', function() {
    const result = validateUrl(this.value);
    const errorElement = document.getElementById('urlError');
    
    if (!result.isValid && this.value.trim()) {
        this.classList.add('error');
        errorElement.textContent = result.message;
        errorElement.classList.add('show');
    } else {
        this.classList.remove('error');
        errorElement.classList.remove('show');
    }
});

// Предупреждение при уходе
window.addEventListener('beforeunload', (e) => {
    if (hasChanges()) {
        e.preventDefault();
        e.returnValue = 'У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?';
    }
});

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadStationData();
    
    // Добавляем обработчик для кнопки удаления
    const deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', showDeleteModal);
    }
});

// Глобальные функции
window.resetForm = resetForm;
window.hideDeleteModal = hideDeleteModal;
window.showDeleteModal = showDeleteModal;