import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';
import { describe, it, expect } from 'vitest';

const TestComponent = () => {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setTheme('light')}>Set Light</button>
    </div>
  );
};

describe('ThemeContext', () => {
  it('provides default theme', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });


  it('allows changing theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    act(() => {
      screen.getByText('Set Light').click();
    });
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });
});
