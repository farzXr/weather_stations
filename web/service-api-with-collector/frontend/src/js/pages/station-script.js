/**
 * ФАЙЛ: station-script.js
 * Скрипт для страницы просмотра детальной информации о станции
 * Отвечает за отображение данных станции, графиков, статистики и управление периодами
 */

import '../../styles/station-style.css';
import { API_BASE_URL } from '../constants/config';
import { formatDate, correctTimeZone, correctForServer, formatForDateTimeInput } from '../utils/dateUtils';
import { formatNumber } from '../utils/numberUtils';
import { showNotification, setButtonLoading, setProgressBar, showError } from '../utils/uiUtils';
import { fetchStationById } from '../api/stationsApi';
import { fetchLatestWeather, fetchWeatherByPeriod, fetchWeatherStats } from '../api/weatherApi';

// ==================== СОСТОЯНИЕ ПРИЛОЖЕНИЯ ====================
// Хранит все данные и состояние UI для переиспользования между функциями

/** Объекты графиков Chart.js (температура, влажность, давление) */
let charts = { temp: null, humidity: null, pressure: null };

/** Текущий выбранный период (5min, day, week и т.д.) */
let currentPeriod = 'day';

/** Данные текущей станции */
let stationData = null;

/** Последние показания погоды */
let latestData = null;

/** Массив данных погоды за выбранный период */
let periodData = [];

/** Статистика за выбранный период */
let statsData = null;

/** Флаг: используется ли кастомный период (свои даты) */
let isCustomPeriod = false;

/** Дата начала кастомного периода */
let customFromDate = null;

/** Дата окончания кастомного периода */
let customToDate = null;


// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Извлекает ID станции из URL-параметров
 * @returns {string|null} ID станции или null, если параметр отсутствует
 */
function getStationIdFromUrl() {
    return new URLSearchParams(window.location.search).get('id');
}

/**
 * Обновляет UI данными о станции (название, ID, локация, URL, даты)
 * @param {Object} station - Объект станции с сервера
 */
function updateStationUI(station) {
    if (!station) return;
    stationData = station;
    
    // Название станции (с защитой от пустого значения)
    document.getElementById('stationName').textContent = station.name?.trim() || 'Станция без названия';
    
    // ID станции
    document.getElementById('stationId').textContent = `ID: ${station.id}`;
    
    // Локация
    document.getElementById('stationLocation').textContent = station.location || '—';
    
    // URL (обрезаем если слишком длинный)
    const urlElement = document.getElementById('stationUrl');
    if (station.url) {
        urlElement.href = station.url;
        urlElement.textContent = station.url.length > 50 ? station.url.substring(0, 50) + '...' : station.url;
    } else {
        urlElement.href = '#';
        urlElement.textContent = '—';
    }
    
    // Даты создания и обновления
    document.getElementById('stationCreated').textContent = formatDate(station.created_at);
    document.getElementById('stationUpdated').textContent = formatDate(station.updated_at);
}

/**
 * Обновляет UI последними показаниями (текущая температура, влажность, давление)
 * @param {Object} latest - Объект с последними показаниями
 */
function updateLatestUI(latest) {
    if (!latest) return;
    latestData = latest;
    
    document.getElementById('currentTemp').textContent = formatNumber(latest.temperature);
    document.getElementById('currentHumidity').textContent = formatNumber(latest.humidity);
    document.getElementById('currentPressure').textContent = formatNumber(latest.pressure);
    document.getElementById('lastUpdateTime').textContent = `Последнее обновление: ${formatDate(latest.created_at)}`;
}

/**
 * Обновляет UI статистикой за период (средние, мин, макс значения)
 * @param {Object} stats - Объект со статистикой
 */
function updateStatsUI(stats) {
    if (!stats) return;
    statsData = stats;
    
    document.getElementById('statsCount').textContent = stats.readings_count || '—';
    document.getElementById('statsAvgTemp').textContent = formatNumber(stats.avg_temperature);
    document.getElementById('statsMinTemp').textContent = formatNumber(stats.min_temperature);
    document.getElementById('statsMaxTemp').textContent = formatNumber(stats.max_temperature);
    document.getElementById('statsAvgHumidity').textContent = formatNumber(stats.avg_humidity);
    document.getElementById('statsAvgPressure').textContent = formatNumber(stats.avg_pressure);
}

/**
 * Определяет единицу времени для оси графика в зависимости от длины периода
 * @param {string} period - Предустановленный период
 * @param {boolean} isCustom - Флаг кастомного периода
 * @param {Date} from - Начало периода
 * @param {Date} to - Конец периода
 * @returns {string} 'minute', 'hour' или 'day'
 */
function getTimeUnit(period, isCustom, from, to) {
    // Для кастомного периода вычисляем по разнице дат
    if (isCustom && from && to) {
        const diffHours = (to - from) / (1000 * 60 * 60);
        if (diffHours <= 1) return 'minute';  // Меньше часа → минуты
        if (diffHours <= 24) return 'hour';   // Меньше суток → часы
        return 'day';                          // Больше суток → дни
    }
    
    // Для предустановленных периодов используем словарь
    const units = {
        '5min': 'minute', '15min': 'minute', '30min': 'minute', '1hour': 'minute',
        '4hours': 'hour', '12hours': 'hour', 'day': 'hour',
        'week': 'day', 'month': 'day'
    };
    return units[period] || 'hour';
}

/**
 * Обновляет все графики новыми данными
 * @param {Array} data - Массив показаний погоды за период
 */
function updateCharts(data) {
    if (!data?.length) return;
    periodData = data;
    
    // Сортируем данные по времени (от старых к новым)
    const sortedData = [...data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    // Подготавливаем подписи для оси X (время с учётом часового пояса)
    const labels = sortedData.map(d => correctTimeZone(d.created_at));
    
    // Определяем единицу времени для графика
    const timeUnit = getTimeUnit(currentPeriod, isCustomPeriod, customFromDate, customToDate);
    
    // Общие настройки для всех графиков
    const commonOptions = {
        responsive: true,              // Адаптация под размер экрана
        maintainAspectRatio: false,    // Можно менять пропорции
        plugins: {
            legend: { display: false }, // Скрываем легенду
            tooltip: {                  // Настройки всплывающих подсказок
                mode: 'index',           // Показывать все линии в точке
                intersect: false,        // Срабатывать даже если не попали в точку
                callbacks: { 
                    label: ctx => `${ctx.parsed.y.toFixed(1)}`  // Формат чисел в подсказке
                }
            }
        },
        scales: {
            x: {                         // Ось времени
                type: 'time',
                time: {
                    unit: timeUnit,       // Минуты, часы или дни
                    displayFormats: {      // Формат подписей на оси
                        minute: 'HH:mm:ss', 
                        hour: 'HH:mm', 
                        day: 'dd.MM' 
                    },
                    tooltipFormat: 'dd.MM.yyyy HH:mm:ss'  // Формат в подсказке
                },
                title: { display: true, text: 'Время' }
            },
            y: {                         // Ось значений
                beginAtZero: false,       // Не обязательно начинать с 0
                title: { display: true }  // Заголовок будет задан отдельно
            }
        }
    };

    // ----- ГРАФИК ТЕМПЕРАТУРЫ -----
    if (charts.temp) charts.temp.destroy();  // Удаляем старый график
    charts.temp = new Chart(document.getElementById('tempChart'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Температура (°C)',
                data: sortedData.map(d => d.temperature),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                tension: 0.1,               // Сглаживание линии
                fill: true                   // Заливка под линией
            }]
        },
        options: { 
            ...commonOptions, 
            scales: { 
                ...commonOptions.scales, 
                y: { ...commonOptions.scales.y, title: { text: '°C' } } 
            } 
        }
    });

    // ----- ГРАФИК ВЛАЖНОСТИ -----
    if (charts.humidity) charts.humidity.destroy();
    charts.humidity = new Chart(document.getElementById('humidityChart'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Влажность (%)',
                data: sortedData.map(d => d.humidity),
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                tension: 0.1,
                fill: true
            }]
        },
        options: { 
            ...commonOptions, 
            scales: { 
                ...commonOptions.scales, 
                y: { ...commonOptions.scales.y, title: { text: '%' } } 
            } 
        }
    });

    // ----- ГРАФИК ДАВЛЕНИЯ -----
    if (charts.pressure) charts.pressure.destroy();
    charts.pressure = new Chart(document.getElementById('pressureChart'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Давление (гПа)',
                data: sortedData.map(d => d.pressure),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                tension: 0.1,
                fill: true
            }]
        },
        options: { 
            ...commonOptions, 
            scales: { 
                ...commonOptions.scales, 
                y: { ...commonOptions.scales.y, title: { text: 'гПа' } } 
            } 
        }
    });
}

/**
 * Получает даты начала и конца для указанного периода
 * @param {string} period - Код периода ('5min', 'day', 'week' и т.д.)
 * @param {Date|null} customFrom - Кастомная дата начала (если есть)
 * @returns {Object} Объект с полями from и to (ISO строки)
 */
function getPeriodDates(period, customFrom = null) {
    const now = new Date();
    const to = now.toISOString();  // Конец периода всегда "сейчас"
    
    // Если есть кастомная дата начала, используем её
    if (customFrom) return { from: new Date(customFrom).toISOString(), to };
    
    // Словарь периодов в миллисекундах
    const periods = {
        '5min': 5 * 60 * 1000,
        '15min': 15 * 60 * 1000,
        '30min': 30 * 60 * 1000,
        '1hour': 60 * 60 * 1000,
        '4hours': 4 * 60 * 60 * 1000,
        '12hours': 12 * 60 * 60 * 1000,
        'day': 24 * 60 * 60 * 1000,
        'week': 7 * 24 * 60 * 60 * 1000,
        'month': 30 * 24 * 60 * 60 * 1000
    };
    
    // Вычисляем дату начала: сейчас минус длительность периода
    const from = new Date(now.getTime() - (periods[period] || periods.day)).toISOString();
    return { from, to };
}

/**
 * Применяет кастомный период (даты из полей ввода)
 * Проверяет корректность дат и загружает данные за этот период
 */
async function applyCustomPeriod() {
    const fromInput = document.getElementById('customFrom').value;
    const toInput = document.getElementById('customTo').value;
    
    // Проверка заполненности полей
    if (!fromInput || !toInput) {
        alert('Пожалуйста, выберите обе даты');
        return;
    }
    
    const from = new Date(fromInput);
    const to = new Date(toInput);
    
    // Проверка логики дат (конец не раньше начала)
    if (to <= from) {
        alert('Дата "По" должна быть позже даты "С"');
        return;
    }
    
    // Ограничение на максимальную длительность (90 дней)
    const daysDiff = (to - from) / (1000 * 60 * 60 * 24);
    if (daysDiff > 90) {
        alert('Период не может превышать 90 дней');
        return;
    }
    
    // Устанавливаем состояние кастомного периода
    isCustomPeriod = true;
    customFromDate = from;
    customToDate = to;
    
    // Снимаем выделение со всех предустановленных кнопок
    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
    
    // Блокируем кнопку и показываем загрузку
    const applyBtn = document.getElementById('applyCustomPeriod');
    setButtonLoading(applyBtn, true, 'Применить', 'Загрузка...');
    
    try {
        const stationId = getStationIdFromUrl();
        
        // Параллельно загружаем данные за период и статистику
        const [period, stats] = await Promise.all([
            fetchWeatherByPeriod(stationId, from.toISOString(), to.toISOString()),
            fetchWeatherStats(stationId, from.toISOString(), to.toISOString())
        ]);
        
        // Обновляем UI полученными данными
        if (period?.length) updateCharts(period);
        if (stats) updateStatsUI(stats);
        
        // Обновляем метку времени с информацией о периоде
        document.getElementById('timestamp').textContent = 
            `Период: ${from.toLocaleString()} — ${to.toLocaleString()} | ${new Date().toLocaleString()}`;
    } catch (error) {
        showNotification('Ошибка загрузки данных', 'error');
    } finally {
        // Разблокируем кнопку в любом случае
        setButtonLoading(applyBtn, false, '✓ Применить', 'Загрузка...');
    }
}

/**
 * Загружает все данные для станции:
 * - Информацию о станции
 * - Последние показания
 * - Данные за текущий период
 * - Статистику
 */
async function loadAllData() {
    const stationId = getStationIdFromUrl();
    if (!stationId) {
        showError(document.querySelector('.container'), 'ID станции не указан в URL', true);
        return;
    }
    
    // Блокируем кнопку обновления
    const refreshBtn = document.getElementById('refreshBtn');
    setButtonLoading(refreshBtn, true, '🔄 Обновить данные', 'Загрузка...');
    
    try {
        // Параллельно загружаем информацию о станции и последние показания
        const [station, latest] = await Promise.all([
            fetchStationById(stationId),
            fetchLatestWeather(stationId).catch(() => null)  // Если нет последних данных - игнорируем
        ]);
        
        // Отображаем загруженные данные
        updateStationUI(station);
        if (latest) updateLatestUI(latest);
        
        // Определяем даты для текущего периода (кастомный или предустановленный)
        const { from, to } = isCustomPeriod && customFromDate && customToDate 
            ? { from: customFromDate.toISOString(), to: customToDate.toISOString() }
            : getPeriodDates(currentPeriod);
        
        // Параллельно загружаем данные за период и статистику
        const [period, stats] = await Promise.all([
            fetchWeatherByPeriod(stationId, from, to).catch(() => []),
            fetchWeatherStats(stationId, from, to).catch(() => null)
        ]);
        
        // Отображаем загруженные данные
        if (period?.length) updateCharts(period);
        if (stats) updateStatsUI(stats);
        
        // Обновляем метку времени
        document.getElementById('timestamp').textContent = `Последнее обновление: ${new Date().toLocaleString()}`;
    } catch (error) {
        showError(document.querySelector('.container'), error.message, true);
    } finally {
        // Разблокируем кнопку в любом случае
        setButtonLoading(refreshBtn, false, '🔄 Обновить данные', 'Загрузка...');
    }
}


// ==================== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ====================

document.addEventListener('DOMContentLoaded', () => {
    // Проверяем наличие ID станции в URL
    if (!getStationIdFromUrl()) {
        showError(document.querySelector('.container'), 'ID станции не указан в URL', true);
        return;
    }
    
    // Загружаем все данные
    loadAllData();

    // Обработчик для кнопки обновления
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadAllData);
    }
    
    // Устанавливаем даты по умолчанию для кастомного периода (вчера - сегодня)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    document.getElementById('customFrom').value = formatForDateTimeInput(yesterday);
    document.getElementById('customTo').value = formatForDateTimeInput(now);
    
    // Обработчики для кнопок предустановленных периодов
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            // Сбрасываем кастомный период
            isCustomPeriod = false;
            customFromDate = customToDate = null;
            
            // Обновляем активную кнопку
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Получаем выбранный период
            currentPeriod = e.target.dataset.period;
            
            // Получаем даты для этого периода
            const { from, to } = getPeriodDates(currentPeriod);
            
            try {
                const stationId = getStationIdFromUrl();
                
                // Загружаем данные за период
                const [period, stats] = await Promise.all([
                    fetchWeatherByPeriod(stationId, from, to),
                    fetchWeatherStats(stationId, from, to)
                ]);
                
                // Обновляем UI
                if (period?.length) updateCharts(period);
                if (stats) updateStatsUI(stats);
            } catch (error) {
                showNotification('Ошибка загрузки данных', 'error');
            }
        });
    });
    
    // Обработчик для кнопки применения кастомного периода
    document.getElementById('applyCustomPeriod').addEventListener('click', applyCustomPeriod);
    
    // Делаем функцию loadAllData глобально доступной
    window.loadAllData = loadAllData;
});