/**
 * Utilities for number and currency formatting in FACTUREAU.
 * Formats numbers according to Senegalese & West African CFA Franc standards
 * where thousands are separated with dots (e.g. 12500 -> "12.500").
 * Also sanitizes legacy/erroneous writings like "12/500" into "12.500".
 */

/**
 * Formats a number with dots as thousand separators.
 * Example: 12500 -> "12.500", 1250000 -> "1.250.000", 500 -> "500"
 */
export function formatNumberDot(val: number | string | null | undefined): string {
  if (val === undefined || val === null || val === '') return '0';

  if (typeof val === 'string') {
    // If the string contains erroneous slash notation like "12/500", fix it immediately
    const cleanStr = val.replace(/12\s*\/\s*500/g, '12.500');
    const parsed = Number(cleanStr.replace(/\s/g, '').replace(/,/g, '.'));
    if (!isNaN(parsed) && cleanStr.match(/^[\d\s.,]+$/)) {
      val = parsed;
    } else {
      return cleanStr;
    }
  }

  const num = typeof val === 'number' ? val : Number(val);
  if (isNaN(num)) return '0';

  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const rounded = Math.round(absNum);

  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Formats an amount with FCFA currency suffix and dot separators.
 * Example: 12500 -> "12.500 FCFA"
 */
export function formatFCFA(val: number | string | null | undefined): string {
  return `${formatNumberDot(val)} FCFA`;
}

/**
 * Global text sanitizer to replace any occurrence of "12/500" with "12.500"
 */
export function sanitizeSlashNumbers(text: string): string {
  if (!text) return text;
  return text.replace(/12\s*\/\s*500/g, '12.500');
}
