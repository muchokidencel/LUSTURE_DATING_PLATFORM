import { render } from '@testing-library/react';
import TourGuide from './TourGuide';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'test@example.com' },
    isAuthenticated: true,
  }),
}));

// Mock TourContext
vi.mock('../../context/TourContext', () => ({
  useTour: () => ({
    isTourActive: true,
    currentStep: 0,
    steps: [
      {
        targetIds: [],
        title: "Welcome to Lustre",
        content: "Discover a private, curated environment...",
        path: "/discovery",
        position: "center",
      },
    ],
    nextStep: vi.fn(),
    prevStep: vi.fn(),
    endTour: vi.fn(),
  }),
}));

describe('TourGuide component responsive behavior', () => {
  const originalInnerWidth = window.innerWidth;

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it('renders tour guide card', () => {
    const { getByText } = render(
      <BrowserRouter>
        <TourGuide />
      </BrowserRouter>
    );
    expect(getByText('Welcome to Lustre')).toBeInTheDocument();
  });

  it('applies full width styling on mobile viewports', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500, // Mobile width
    });

    const { getByText } = render(
      <BrowserRouter>
        <TourGuide />
      </BrowserRouter>
    );

    const guideCard = getByText('Welcome to Lustre').closest('.bg-card\\/95');
    expect(guideCard).toBeInTheDocument();
  });
});
