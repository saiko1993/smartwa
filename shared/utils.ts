/**
 * Utility functions for the application
 */

/**
 * Generates a random ID for database entities
 * @returns A unique string ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Formats a number to Arabic numerals
 * @param num Number to format 
 * @returns Formatted string
 */
export function formatNumberAr(num: number): string {
  return num.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
}

/**
 * Formats a date to Arabic format
 * @param dateStr Date string or object
 * @returns Formatted date string
 */
export function formatDateAr(dateStr: string | Date): string {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return date.toLocaleDateString('ar-EG', options);
}

/**
 * Formats a currency amount to Arabic format
 * @param amount Amount to format
 * @returns Formatted currency string
 */
export function formatCurrencyAr(amount: number): string {
  const formatted = amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  return formatted.replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]) + ' ج.م';
}