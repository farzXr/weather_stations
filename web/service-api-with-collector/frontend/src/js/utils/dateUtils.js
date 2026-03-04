import { TIMEZONE_OFFSET } from '../constants/config';

// Корректировка времени (+4 часа для отображения)
export function correctTimeZone(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    date.setHours(date.getHours() + TIMEZONE_OFFSET);
    return date;
}

// Форматирование даты для отображения
export function formatDate(dateString) {
    if (!dateString) return 'Неизвестно';
    try {
        const date = correctTimeZone(dateString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateString;
    }
}

// Корректировка для отправки на сервер (вычитаем 4 часа)
export function correctForServer(date) {
    return new Date(date.getTime() - TIMEZONE_OFFSET * 60 * 60 * 1000).toISOString();
}

// Форматирование для input datetime-local
export function formatForDateTimeInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}