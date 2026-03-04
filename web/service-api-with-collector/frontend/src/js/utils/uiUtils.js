/**
 * Показывает всплывающее уведомление
 * @param {string} message - Текст уведомления
 * @param {string} [type='info'] - Тип: 'success', 'error', 'info'
 * @param {string} [containerId='notificationContainer'] - ID контейнера для уведомлений
 */
export function showNotification(message, type = 'info', containerId = 'notificationContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    notification.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    
    container.innerHTML = ''; // Очищаем предыдущие уведомления
    container.appendChild(notification);
    
    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300); // Удаляем после анимации
    }, 5000);
}

/**
 * Управляет состоянием кнопки во время загрузки (блокировка + спиннер)
 * @param {HTMLElement} button - Элемент кнопки
 * @param {boolean} isLoading - true = включить режим загрузки, false = выключить
 * @param {string} [text='Загрузить'] - Обычный текст кнопки
 * @param {string} [loadingText='Загрузка...'] - Текст во время загрузки
 */
export function setButtonLoading(button, isLoading, text = 'Загрузить', loadingText = 'Загрузка...') {
    button.disabled = isLoading; // Блокируем повторные нажатия
    button.innerHTML = isLoading ? `<span>⏳</span> ${loadingText}` : `${text}`;
}

/**
 * Показывает или скрывает прогресс-бар
 * @param {string} progressBarId - ID элемента прогресс-бара
 * @param {boolean} isActive - true = показать, false = скрыть
 */
export function setProgressBar(progressBarId, isActive) {
    const progressBar = document.getElementById(progressBarId);
    if (progressBar) {
        progressBar.classList.toggle('active', isActive);
    }
}

/**
 * Показывает сообщение об ошибке в указанном контейнере
 * @param {string|HTMLElement} container - ID контейнера или сам DOM-элемент
 * @param {string} message - Текст ошибки
 * @param {boolean} [withBackLink=false] - Добавлять ли ссылку возврата к списку
 */
export function showError(container, message, withBackLink = false) {
    if (typeof container === 'string') {
        container = document.getElementById(container);
    }
    if (!container) return;
    
    const backLink = withBackLink 
        ? '<br><br><a href="index.html" class="back-btn" style="display: inline-block;">← К списку станций</a>' 
        : '';
    
    container.innerHTML = `<div class="error">❌ ${message}${backLink}</div>`;
}