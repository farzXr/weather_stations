import '../../styles/create-style.css';
import { API_BASE_URL, APP_BASE_URL } from '../constants/config';
import { validateStationName, validateLocation, validateUrl } from '../utils/validationUtils';
import { showNotification, setButtonLoading, setProgressBar } from '../utils/uiUtils';
import { createStation } from '../api/stationsApi';

// Валидация всей формы
function validateForm() {
    let isValid = true;
    
    // Очистка предыдущих ошибок
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

function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}Error`);
    
    input.classList.add('error');
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

// Очистка формы
function clearForm() {
    document.getElementById('createStationForm').reset();
    document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('input').forEach(el => el.classList.remove('error'));
    document.getElementById('resultCard').classList.remove('show');
}

// Обработка отправки
document.getElementById('createStationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
        showNotification('Пожалуйста, исправьте ошибки в форме', 'error');
        return;
    }
    
    const stationData = {
        name: document.getElementById('name').value.trim(),
        location: document.getElementById('location').value.trim(),
        url: document.getElementById('url').value.trim()
    };
    
    const submitBtn = document.getElementById('submitBtn');
    const progressBar = document.getElementById('progressBar');
    
    setButtonLoading(submitBtn, true, 'Создать станцию', 'Создание...');
    setProgressBar('progressBar', true);
    
    try {
        const result = await createStation(stationData);
        
        // Показываем результат
        document.getElementById('resultId').textContent = result.id || 'Не указан';
        document.getElementById('resultName').textContent = result.name || stationData.name;
        document.getElementById('resultLocation').textContent = result.location || stationData.location;
        document.getElementById('resultUrl').textContent = result.url || stationData.url;
        document.getElementById('viewStationLink').href = `${APP_BASE_URL}/station?id=${encodeURIComponent(result.id)}`;
        document.querySelector('.navigation .back-btn').href = `http://${APP_BASE_URL}/home`;
        
        document.getElementById('resultCard').classList.add('show');
        showNotification('Станция успешно создана!', 'success');
    } catch (error) {
        showNotification(`Ошибка при создании: ${error.message}`, 'error');
    } finally {
        setButtonLoading(submitBtn, false, '💾 Создать станцию', 'Создание...');
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
    const name = document.getElementById('name').value.trim();
    const location = document.getElementById('location').value.trim();
    const url = document.getElementById('url').value.trim();
    
    if (name || location || url) {
        e.preventDefault();
        e.returnValue = 'У вас есть несохраненные данные. Вы уверены, что хотите покинуть страницу?';
    }
});

// Глобальные функции
window.clearForm = clearForm;