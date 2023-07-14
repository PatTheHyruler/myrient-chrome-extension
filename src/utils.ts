export function round(value: number, precision: number = 1): number {
    precision = Math.round(precision);
    if (precision <= 0) {
        return Math.round(value);
    }
    const multiplier = 10 ** precision;
    const result = Math.round(Math.abs(value) * multiplier) / multiplier;
    return parseFloat(result.toFixed(precision));
}
