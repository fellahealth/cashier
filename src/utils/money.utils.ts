const getCurrencyExponent = (currency: string): number =>
  new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
    .maximumFractionDigits ?? 2;

export const toMinorUnits = (majorUnits: number, currency: string): number =>
  Math.round(majorUnits * 10 ** getCurrencyExponent(currency));
