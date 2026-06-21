import { describe, it, expect } from 'vitest';
import { getErrorMessage } from './errors';

describe('getErrorMessage', () => {
  it('reads response.data.message when present', () => {
    const err = { response: { data: { message: 'Invalid credentials' } } };
    expect(getErrorMessage(err, 'fallback')).toBe('Invalid credentials');
  });

  it('falls back to the first Zod validation error when there is no top-level message', () => {
    const err = {
      response: {
        data: {
          status: 'error',
          errors: [{ path: 'displayName', message: 'Display name is required' }],
        },
      },
    };
    expect(getErrorMessage(err, 'fallback')).toBe('Display name is required');
  });

  it('prefers response.data.message over the errors array when both are present', () => {
    const err = { response: { data: { message: 'Top-level message', errors: [{ message: 'Nested' }] } } };
    expect(getErrorMessage(err, 'fallback')).toBe('Top-level message');
  });

  it('returns the fallback for plain errors and unrecognized shapes', () => {
    expect(getErrorMessage(new Error('boom'), 'fallback')).toBe('fallback');
    expect(getErrorMessage({ response: { data: {} } }, 'fallback')).toBe('fallback');
    expect(getErrorMessage(undefined, 'fallback')).toBe('fallback');
  });
});
