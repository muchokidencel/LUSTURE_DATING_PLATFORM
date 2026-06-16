/**
 * Formats a number as KES currency.
 * @param amount The amount to format
 * @returns Formatted string
 */
export const formatKES = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Formats a date string or object into a human-readable format.
 * @param date Date to format
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};
