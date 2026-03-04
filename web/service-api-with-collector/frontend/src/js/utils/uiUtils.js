// Показать уведомление
export function showNotification(message, type = 'info', containerId = 'notificationContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    notification.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    
    container.innerHTML = '';
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Управление состоянием кнопки загрузки
export function setButtonLoading(button, isLoading, text = 'Загрузить', loadingText = 'Загрузка...') {
    button.disabled = isLoading;
    button.innerHTML = isLoading ? `<span>⏳</span> ${loadingText}` : `${text}`;
}

// Управление прогресс-баром
export function setProgressBar(progressBarId, isActive) {
    const progressBar = document.getElementById(progressBarId);
    if (progressBar) {
        if (isActive) {
            progressBar.classList.add('active');
        } else {
            progressBar.classList.remove('active');
        }
    }
}

// Показать ошибку в контейнере
export function showError(container, message, withBackLink = false) {
    if (typeof container === 'string') {
        container = document.getElementById(container);
    }
    if (!container) return;
    
    const backLink = withBackLink ? '<br><br><a href="index.html" class="back-btn" style="display: inline-block;">← К списку станций</a>' : '';
    container.innerHTML = `<div class="error">❌ ${message}${backLink}</div>`;
}