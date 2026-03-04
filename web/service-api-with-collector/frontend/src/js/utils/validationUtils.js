// Проверка URL
export function isValidUrl(string) {
    if (!string) return false;
    try {
        new URL(string);
        return true;
    } catch {
        return false;
    }
}

// Валидация названия станции
export function validateStationName(name) {
    if (!name || name.trim() === '') {
        return { isValid: false, message: 'Введите название станции' };
    }
    if (name.trim().length < 2) {
        return { isValid: false, message: 'Название должно содержать минимум 2 символа' };
    }
    return { isValid: true };
}

// Валидация локации
export function validateLocation(location) {
    if (!location || location.trim() === '') {
        return { isValid: false, message: 'Введите местоположение' };
    }
    return { isValid: true };
}

// Валидация URL
export function validateUrl(url) {
    if (!url || url.trim() === '') {
        return { isValid: false, message: 'Введите URL станции' };
    }
    if (!url.match(/^https?:\/\//i)) {
        return { isValid: false, message: 'URL должен начинаться с http:// или https://' };
    }
    try {
        new URL(url);
        return { isValid: true };
    } catch {
        return { isValid: false, message: 'Некорректный формат URL' };
    }
}