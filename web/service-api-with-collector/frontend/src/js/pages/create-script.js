/**
 * ФАЙЛ: create-script.js
 * Скрипт для страницы создания новой станции
 * Отвечает за валидацию формы, отправку данных на сервер и отображение результата
 */

import '../../styles/create-style.css';
import { API_BASE_URL, APP_BASE_URL } from '../constants/config';
import { validateStationName, validateLocation, validateUrl } from '../utils/validationUtils';
import { showNotification, setButtonLoading, setProgressBar } from '../utils/uiUtils';
import { createStation } from '../api/stationsApi';

// ==================== ВАЛИДАЦИЯ ФОРМЫ ====================

/**
 * Валидация всей формы перед отправкой
 * Проверяет все поля и показывает ошибки
 * @returns {boolean} true если форма валидна, false если есть ошибки
 */
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
 * Очистка формы и сброс всех ошибок
 */
function clearForm() {
    document.getElementById('createStationForm').reset();
    document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('input').forEach(el => el.classList.remove('error'));
    document.getElementById('resultCard').classList.remove('show');  // Скрываем карточку результата
}


// ==================== ОБРАБОТЧИК ОТПРАВКИ ФОРМЫ ====================

document.getElementById('createStationForm').addEventListener('submit', async (e) => {
    e.preventDefault();  // Отменяем стандартную отправку формы
    
    // Проверяем валидность данных
    if (!validateForm()) {
        showNotification('Пожалуйста, исправьте ошибки в форме', 'error');
        return;
    }
    
    // Собираем данные из формы (обрезаем пробелы)
    const stationData = {
        name: document.getElementById('name').value.trim(),
        location: document.getElementById('location').value.trim(),
        url: document.getElementById('url').value.trim()
    };
    
    const submitBtn = document.getElementById('submitBtn');
    const progressBar = document.getElementById('progressBar');
    
    // Блокируем кнопку и показываем прогресс
    setButtonLoading(submitBtn, true, 'Создать станцию', 'Создание...');
    setProgressBar('progressBar', true);
    
    try {
        // Отправляем данные на сервер
        const result = await createStation(stationData);
        
        // Отображаем карточку с результатами
        document.getElementById('resultId').textContent = result.id || 'Не указан';
        document.getElementById('resultName').textContent = result.name || stationData.name;
        document.getElementById('resultLocation').textContent = result.location || stationData.location;
        document.getElementById('resultUrl').textContent = result.url || stationData.url;
        
        // Устанавливаем ссылку на просмотр созданной станции
        document.getElementById('viewStationLink').href = `${APP_BASE_URL}/station?id=${encodeURIComponent(result.id)}`;
        document.querySelector('.navigation .back-btn').href = `${APP_BASE_URL}/home`;
        
        // Показываем карточку с результатом
        document.getElementById('resultCard').classList.add('show');
        
        showNotification('Станция успешно создана!', 'success');
    } catch (error) {
        showNotification(`Ошибка при создании: ${error.message}`, 'error');
    } finally {
        // Разблокируем кнопку и скрываем прогресс в любом случае
        setButtonLoading(submitBtn, false, '💾 Создать станцию', 'Создание...');
        setProgressBar('progressBar', false);
    }
});


// ==================== ВАЛИДАЦИЯ В РЕАЛЬНОМ ВРЕМЕНИ ====================

/**
 * Валидация URL в реальном времени (при вводе)
 * Срабатывает на каждое изменение поля URL
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


// ==================== ПРЕДУПРЕЖДЕНИЕ ПРИ УХОДЕ ====================

/**
 * Предупреждение при попытке уйти со страницы с незаполненной формой
 * Срабатывает при закрытии вкладки или переходе по ссылке
 */
window.addEventListener('beforeunload', (e) => {
    const name = document.getElementById('name').value.trim();
    const location = document.getElementById('location').value.trim();
    const url = document.getElementById('url').value.trim();
    
    // Если хоть одно поле заполнено, показываем предупреждение
    if (name || location || url) {
        e.preventDefault();
        e.returnValue = 'У вас есть несохраненные данные. Вы уверены, что хотите покинуть страницу?';
    }
});


// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================
// Делаем функции доступными для вызова из HTML (onclick)

/** Функция очистки формы, вызывается из кнопки "Очистить" */
window.clearForm = clearForm;