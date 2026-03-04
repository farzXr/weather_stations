import { TIMEZONE_OFFSET } from '../constants/config';

/**
 * КОРРЕКТИРОВКА ВРЕМЕНИ ДЛЯ ОТОБРАЖЕНИЯ ПОЛЬЗОВАТЕЛЮ
 * Добавляет смещение часового пояса к UTC времени из базы данных
 * 
 * @param {string} dateString - Дата в формате ISO (например, "2024-01-20T10:00:00Z")
 * @returns {Date|null} Объект Date с учётом часового пояса или null если дата не передана
 * 
 * Пример: 2024-01-20T10:00:00Z (UTC) +4 часа = 2024-01-20T14:00:00 (локальное)
 */
export function correctTimeZone(dateString) {
    if (!dateString) return null;                    // Если нет даты, возвращаем null
    
    const date = new Date(dateString);                // Создаём объект Date из строки
    date.setHours(date.getHours() + TIMEZONE_OFFSET); // Добавляем смещение часового пояса (например +4)
    return date;                                      // Возвращаем скорректированную дату
}

/**
 * ФОРМАТИРОВАНИЕ ДАТЫ ДЛЯ ОТОБРАЖЕНИЯ НА СТРАНИЦЕ
 * Преобразует дату из БД в читаемый формат "ДД.ММ.ГГГГ ЧЧ:ММ"
 * 
 * @param {string} dateString - Дата в формате ISO
 * @returns {string} Отформатированная дата или "Неизвестно" при ошибке
 * 
 * Пример: "2024-01-20T10:00:00Z" → "20.01.2024, 14:00"
 */
export function formatDate(dateString) {
    if (!dateString) return 'Неизвестно';              // Если даты нет, возвращаем заглушку
    
    try {
        const date = correctTimeZone(dateString);       // Сначала корректируем часовой пояс
        
        // Форматируем дату в русском формате
        return date.toLocaleString('ru-RU', {
            day: '2-digit',      // День двумя цифрами (01, 02... 31)
            month: '2-digit',    // Месяц двумя цифрами (01, 02... 12)
            year: 'numeric',     // Год полностью (2024)
            hour: '2-digit',     // Час двумя цифрами (00... 23)
            minute: '2-digit'    // Минуты двумя цифрами (00... 59)
        });
    } catch {
        return dateString;        // В случае ошибки возвращаем исходную строку
    }
}

/**
 * КОРРЕКТИРОВКА ДЛЯ ОТПРАВКИ НА СЕРВЕР
 * Вычитает смещение часового пояса (обратная операция correctTimeZone)
 * Сервер ожидает даты в UTC, поэтому нужно "откатить" локальное время
 * 
 * @param {Date} date - Локальная дата (из календаря пользователя)
 * @returns {string} Дата в формате ISO для отправки на сервер
 * 
 * Пример: локальная дата 2024-01-20 14:00 (-4 часа) → "2024-01-20T10:00:00.000Z"
 */
export function correctForServer(date) {
    // Вычитаем смещение (TIMEZONE_OFFSET * количество миллисекунд в часе)
    // и преобразуем в ISO строку для отправки
    return new Date(date.getTime() - TIMEZONE_OFFSET * 60 * 60 * 1000).toISOString();
}

/**
 * ФОРМАТИРОВАНИЕ ДЛЯ HTML INPUT TYPE="DATETIME-LOCAL"
 * Преобразует дату в формат, понятный элементу <input type="datetime-local">
 * 
 * @param {Date} date - Объект Date для форматирования
 * @returns {string} Дата в формате "ГГГГ-ММ-ДДTЧЧ:ММ"
 * 
 * Пример: new Date(2024, 0, 20, 14, 30) → "2024-01-20T14:30"
 */
export function formatForDateTimeInput(date) {
    // getFullYear() - получает год (2024)
    const year = date.getFullYear();
    
    // getMonth() + 1 - месяцы в JS идут с 0 (0 - январь, 11 - декабрь)
    // padStart(2, '0') - добавляет ведущий ноль (1 → "01")
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // getDate() - день месяца (1-31)
    const day = String(date.getDate()).padStart(2, '0');
    
    // getHours() - часы (0-23)
    const hours = String(date.getHours()).padStart(2, '0');
    
    // getMinutes() - минуты (0-59)
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    // Формат для input: ГГГГ-ММ-ДДTЧЧ:ММ
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}