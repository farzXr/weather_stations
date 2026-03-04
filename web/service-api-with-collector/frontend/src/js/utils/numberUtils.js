/**
 * Форматирует число с заданным количеством знаков после запятой
 * @param {number|string|null|undefined} value - Число для форматирования
 * @param {number} [decimals=1] - Количество знаков после запятой
 * @returns {string} Отформатированное число или '—' если значения нет
 */
export function formatNumber(value, decimals = 1) {
    if (value === undefined || value === null) return '—';
    return Number(value).toFixed(decimals);
}