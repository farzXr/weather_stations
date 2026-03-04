export function formatNumber(value, decimals = 1) {
    if (value === undefined || value === null) return '—';
    return Number(value).toFixed(decimals);
}