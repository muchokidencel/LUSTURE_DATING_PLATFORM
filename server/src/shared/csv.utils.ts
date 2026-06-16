/**
 * Converts an array of objects to a CSV string.
 * Handles nested values via JSON.stringify, escapes commas and quotes properly.
 */
export function jsonToCsv(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  // Header row
  csvRows.push(headers.map(escapeCsvField).join(','));

  // Data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') return escapeCsvField(JSON.stringify(val));
      return escapeCsvField(String(val));
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Escapes a single CSV field value. Wraps in double quotes if the value
 * contains commas, double-quotes, or newlines. Doubles up any internal
 * double-quotes per RFC 4180.
 */
export function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
