import '../../styles/station-style.css';
import { API_BASE_URL } from '../constants/config';
import { formatDate, correctTimeZone, correctForServer, formatForDateTimeInput } from '../utils/dateUtils';
import { formatNumber } from '../utils/numberUtils';
import { showNotification, setButtonLoading, setProgressBar, showError } from '../utils/uiUtils';
import { fetchStationById } from '../api/stationsApi';
import { fetchLatestWeather, fetchWeatherByPeriod, fetchWeatherStats } from '../api/weatherApi';

// Состояние приложения
let charts = { temp: null, humidity: null, pressure: null };
let currentPeriod = 'day';
let stationData = null;
let latestData = null;
let periodData = [];
let statsData = null;
let isCustomPeriod = false;
let customFromDate = null;
let customToDate = null;

// Получение ID станции из URL
function getStationIdFromUrl() {
    return new URLSearchParams(window.location.search).get('id');
}

// Обновление UI с данными станции
function updateStationUI(station) {
    if (!station) return;
    stationData = station;
    
    document.getElementById('stationName').textContent = station.name?.trim() || 'Станция без названия';
    document.getElementById('stationId').textContent = `ID: ${station.id}`;
    document.getElementById('stationLocation').textContent = station.location || '—';
    
    const urlElement = document.getElementById('stationUrl');
    if (station.url) {
        urlElement.href = station.url;
        urlElement.textContent = station.url.length > 50 ? station.url.substring(0, 50) + '...' : station.url;
    } else {
        urlElement.href = '#';
        urlElement.textContent = '—';
    }
    
    document.getElementById('stationCreated').textContent = formatDate(station.created_at);
    document.getElementById('stationUpdated').textContent = formatDate(station.updated_at);
}

// Обновление UI с последними данными
function updateLatestUI(latest) {
    if (!latest) return;
    latestData = latest;
    
    document.getElementById('currentTemp').textContent = formatNumber(latest.temperature);
    document.getElementById('currentHumidity').textContent = formatNumber(latest.humidity);
    document.getElementById('currentPressure').textContent = formatNumber(latest.pressure);
    document.getElementById('lastUpdateTime').textContent = `Последнее обновление: ${formatDate(latest.created_at)}`;
}

// Обновление UI со статистикой
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

// Определение единицы времени для графика
function getTimeUnit(period, isCustom, from, to) {
    if (isCustom && from && to) {
        const diffHours = (to - from) / (1000 * 60 * 60);
        if (diffHours <= 1) return 'minute';
        if (diffHours <= 24) return 'hour';
        return 'day';
    }
    
    const units = {
        '5min': 'minute', '15min': 'minute', '30min': 'minute', '1hour': 'minute',
        '4hours': 'hour', '12hours': 'hour', 'day': 'hour',
        'week': 'day', 'month': 'day'
    };
    return units[period] || 'hour';
}

// Обновление графиков
function updateCharts(data) {
    if (!data?.length) return;
    periodData = data;
    
    const sortedData = [...data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const labels = sortedData.map(d => correctTimeZone(d.created_at));
    
    const timeUnit = getTimeUnit(currentPeriod, isCustomPeriod, customFromDate, customToDate);
    
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: { label: ctx => `${ctx.parsed.y.toFixed(1)}` }
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: timeUnit,
                    displayFormats: { minute: 'HH:mm:ss', hour: 'HH:mm', day: 'dd.MM' },
                    tooltipFormat: 'dd.MM.yyyy HH:mm:ss'
                },
                title: { display: true, text: 'Время' }
            },
            y: { beginAtZero: false, title: { display: true } }
        }
    };

    // Температура
    if (charts.temp) charts.temp.destroy();
    charts.temp = new Chart(document.getElementById('tempChart'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Температура (°C)',
                data: sortedData.map(d => d.temperature),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                tension: 0.1,
                fill: true
            }]
        },
        options: { ...commonOptions, scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, title: { text: '°C' } } } }
    });

    // Влажность
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
        options: { ...commonOptions, scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, title: { text: '%' } } } }
    });

    // Давление
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
        options: { ...commonOptions, scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, title: { text: 'гПа' } } } }
    });
}

// Получение дат для периода
function getPeriodDates(period, customFrom = null) {
    const now = new Date();
    const to = now.toISOString();
    
    if (customFrom) return { from: new Date(customFrom).toISOString(), to };
    
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
    
    const from = new Date(now.getTime() - (periods[period] || periods.day)).toISOString();
    return { from, to };
}

// Применение кастомного периода
async function applyCustomPeriod() {
    const fromInput = document.getElementById('customFrom').value;
    const toInput = document.getElementById('customTo').value;
    
    if (!fromInput || !toInput) {
        alert('Пожалуйста, выберите обе даты');
        return;
    }
    
    const from = new Date(fromInput);
    const to = new Date(toInput);
    
    if (to <= from) {
        alert('Дата "По" должна быть позже даты "С"');
        return;
    }
    
    const daysDiff = (to - from) / (1000 * 60 * 60 * 24);
    if (daysDiff > 90) {
        alert('Период не может превышать 90 дней');
        return;
    }
    
    isCustomPeriod = true;
    customFromDate = from;
    customToDate = to;
    
    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
    
    const applyBtn = document.getElementById('applyCustomPeriod');
    setButtonLoading(applyBtn, true, 'Применить', 'Загрузка...');
    
    try {
        const stationId = getStationIdFromUrl();
        const [period, stats] = await Promise.all([
            fetchWeatherByPeriod(stationId, from.toISOString(), to.toISOString()),
            fetchWeatherStats(stationId, from.toISOString(), to.toISOString())
        ]);
        
        if (period?.length) updateCharts(period);
        if (stats) updateStatsUI(stats);
        
        document.getElementById('timestamp').textContent = 
            `Период: ${from.toLocaleString()} — ${to.toLocaleString()} | ${new Date().toLocaleString()}`;
    } catch (error) {
        showNotification('Ошибка загрузки данных', 'error');
    } finally {
        setButtonLoading(applyBtn, false, '✓ Применить', 'Загрузка...');
    }
}

// Загрузка всех данных
async function loadAllData() {
    const stationId = getStationIdFromUrl();
    if (!stationId) {
        showError(document.querySelector('.container'), 'ID станции не указан в URL', true);
        return;
    }
    
    const refreshBtn = document.getElementById('refreshBtn');
    setButtonLoading(refreshBtn, true, '🔄 Обновить данные', 'Загрузка...');
    
    try {
        const [station, latest] = await Promise.all([
            fetchStationById(stationId),
            fetchLatestWeather(stationId).catch(() => null)
        ]);
        
        updateStationUI(station);
        if (latest) updateLatestUI(latest);
        
        const { from, to } = isCustomPeriod && customFromDate && customToDate 
            ? { from: customFromDate.toISOString(), to: customToDate.toISOString() }
            : getPeriodDates(currentPeriod);
        
        const [period, stats] = await Promise.all([
            fetchWeatherByPeriod(stationId, from, to).catch(() => []),
            fetchWeatherStats(stationId, from, to).catch(() => null)
        ]);
        
        if (period?.length) updateCharts(period);
        if (stats) updateStatsUI(stats);
        
        document.getElementById('timestamp').textContent = `Последнее обновление: ${new Date().toLocaleString()}`;
    } catch (error) {
        showError(document.querySelector('.container'), error.message, true);
    } finally {
        setButtonLoading(refreshBtn, false, '🔄 Обновить данные', 'Загрузка...');
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    if (!getStationIdFromUrl()) {
        showError(document.querySelector('.container'), 'ID станции не указан в URL', true);
        return;
    }
    
    loadAllData();

    // Добавляем обработчик для кнопки обновления
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadAllData);
    }

    const backLink = document.querySelector('.back-btn');
    if (backLink) {
        backLink.href = `http://${API_BASE_URL}/home`;  // или относительный путь
    }
    
    // Устанавливаем даты по умолчанию для кастомного периода
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    document.getElementById('customFrom').value = formatForDateTimeInput(yesterday);
    document.getElementById('customTo').value = formatForDateTimeInput(now);
    
    // Обработчики кнопок периода
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            isCustomPeriod = false;
            customFromDate = customToDate = null;
            
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            currentPeriod = e.target.dataset.period;
            const { from, to } = getPeriodDates(currentPeriod);
            
            try {
                const stationId = getStationIdFromUrl();
                const [period, stats] = await Promise.all([
                    fetchWeatherByPeriod(stationId, from, to),
                    fetchWeatherStats(stationId, from, to)
                ]);
                
                if (period?.length) updateCharts(period);
                if (stats) updateStatsUI(stats);
            } catch (error) {
                showNotification('Ошибка загрузки данных', 'error');
            }
        });
    });
    
    document.getElementById('applyCustomPeriod').addEventListener('click', applyCustomPeriod);
    window.loadAllData = loadAllData;
});