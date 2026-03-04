/**
 * ФАЙЛ: config.js
 * Конфигурационный файл с настройками окружения
 * Значения подставляются Webpack'ом через DefinePlugin
 */

/**
 * Базовый URL для API-запросов к бэкенду
 * Используется во всех вызовах fetch для обращения к серверу
 * @type {string}
 * @example
 * fetch(`${API_BASE_URL}/stations/list`)
 * // => 'http://localhost:8080/api/v1/stations/list'
 */
export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api/v1';

/**
 * Базовый URL самого приложения (frontend)
 * Используется для навигации между страницами
 * @type {string}
 * @example
 * window.location.href = `${APP_BASE_URL}/station/edit?id=123`
 * // => 'http://localhost:8080/station/edit?id=123'
 */
export const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:8080';

/**
 * Смещение часового пояса относительно UTC (в часах)
 * Используется для коррекции времени при отображении и отправке на сервер
 * @type {number}
 * @example
 * // Для Москвы (UTC+3) значение будет 3
 * // Для Владивостока (UTC+7) значение будет 7
 */
export const TIMEZONE_OFFSET = process.env.TIMEZONE_OFFSET || 4;