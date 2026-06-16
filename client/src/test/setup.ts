import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Polyfill IntersectionObserver
class IntersectionObserverMock {
  root = null;
  rootMargin = "";
  thresholds = [];
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() { return []; }
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

// Polyfill matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Polyfill window.scrollTo
window.scrollTo = vi.fn();

