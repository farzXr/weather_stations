/**
 * Проверяет, является ли строка валидным URL
 * @param {string} string - Проверяемая строка
 * @returns {boolean} true если строка - валидный URL
 */
export function isValidUrl(string) {
    if (!string) return false;
    try {
        new URL(string); // Конструктор URL выбросит ошибку при невалидном URL
        return true;
    } catch {
        return false;
    }
}

/**
 * Валидация названия станции
 * @param {string} name - Название станции
 * @returns {{isValid: boolean, message?: string}} Объект с результатом и сообщением об ошибке
 */
export function validateStationName(name) {
    const trimmed = name?.trim() || '';
    
    if (!trimmed) {
        return { isValid: false, message: 'Введите название станции' };
    }
    if (trimmed.length < 2) {
        return { isValid: false, message: 'Название должно содержать минимум 2 символа' };
    }
    if (trimmed.length > 250) {
        return { isValid: false, message: 'Название не может превышать 250 символов' };
    }
    return { isValid: true };
}

/**
 * Валидация местоположения станции
 * @param {string} location - Местоположение
 * @returns {{isValid: boolean, message?: string}} Объект с результатом и сообщением об ошибке
 */
export function validateLocation(location) {
    const trimmed = location?.trim() || '';
    
    if (!trimmed) {
        return { isValid: false, message: 'Введите местоположение' };
    }
    if (trimmed.length > 250) {
        return { isValid: false, message: 'Название локации не может превышать 250 символов' };
    }
    return { isValid: true };
}

/**
 * Валидация URL станции
 * @param {string} url - URL станции
 * @returns {{isValid: boolean, message?: string}} Объект с результатом и сообщением об ошибке
 */
export function validateUrl(url) {
    const trimmed = url?.trim() || '';
    
    if (!trimmed) {
        return { isValid: false, message: 'Введите URL станции' };
    }
    if (trimmed.length > 250) {
        return { isValid: false, message: 'URL не может превышать 250 символов' };
    }
    if (!/^https?:\/\//i.test(trimmed)) {
        return { isValid: false, message: 'URL должен начинаться с http:// или https://' };
    }
    try {
        new URL(trimmed); // Проверяем корректность формата URL
        return { isValid: true };
    } catch {
        return { isValid: false, message: 'Некорректный формат URL' };
    }
}