import { describe, it, expect } from 'vitest';
import { jsonToCsv, escapeCsvField } from './csv.utils.js';

describe('escapeCsvField', () => {
  it('returns plain value unchanged when no special characters', () => {
    expect(escapeCsvField('hello')).toBe('hello');
  });

  it('wraps value in double-quotes when it contains a comma', () => {
    expect(escapeCsvField('hello, world')).toBe('"hello, world"');
  });

  it('wraps value in double-quotes when it contains a newline', () => {
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
  });

  it('doubles up internal double-quotes per RFC 4180', () => {
    expect(escapeCsvField('say "hello"')).toBe('"say ""hello"""');
  });

  it('handles empty string', () => {
    expect(escapeCsvField('')).toBe('');
  });
});

describe('jsonToCsv', () => {
  it('returns empty string for an empty array', () => {
    expect(jsonToCsv([])).toBe('');
  });

  it('generates correct header row from object keys', () => {
    const data = [{ name: 'Alice', age: 30 }];
    const csv = jsonToCsv(data);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('name,age');
  });

  it('generates correct data rows', () => {
    const data = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ];
    const csv = jsonToCsv(data);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('Alice,30');
    expect(lines[2]).toBe('Bob,25');
  });

  it('handles null and undefined values as empty strings', () => {
    const data = [{ name: 'Alice', email: null, phone: undefined }] as any[];
    const csv = jsonToCsv(data);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('Alice,,');
  });

  it('wraps string values with commas in double-quotes', () => {
    const data = [{ name: 'Smith, John', city: 'Nairobi' }];
    const csv = jsonToCsv(data);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('"Smith, John",Nairobi');
  });

  it('JSON-serializes nested objects into a quoted field', () => {
    const data = [{ name: 'Alice', meta: { tier: 'gold' } }];
    const csv = jsonToCsv(data);
    const lines = csv.split('\n');
    // {"tier":"gold"} contains quotes -> should be double-quoted
    expect(lines[1]).toContain('"');
    expect(lines[1]).toContain('tier');
  });

  it('produces the correct number of rows including header', () => {
    const data = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' },
    ];
    const csv = jsonToCsv(data);
    const lines = csv.split('\n');
    expect(lines.length).toBe(4); // 1 header + 3 data rows
  });
});
