import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditProfile from './EditProfile';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
const mockMutateAsync = vi.fn();

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockProfileData = {
  id: 1,
  fullName: 'Denzel Washington',
  bio: 'Actor and director.',
  idealSunday: 'Relaxing and reading.',
  age: 65,
  gender: 'Male',
  location: 'Los Angeles',
  whatsapp: '+254712345678',
  instagram: 'denzel_w',
  ghostMode: false,
  latitude: null,
  longitude: null,
  intent: 'relationship',
  preferences: {
    interestedInGenders: ['female'],
    minAge: 25,
    maxAge: 45,
    maxDistanceKm: 100,
    intentPreference: 'relationship'
  },
  photos: [{ url: 'http://photo.com/1.jpg', public_id: '1' }]
};

// Mock useQueries hooks
vi.mock('../hooks/useQueries', () => ({
  useProfile: () => ({
    data: mockProfileData,
    isLoading: false,
  }),
  useUpdateProfile: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useUploadPhoto: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeletePhoto: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

describe('EditProfile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form inputs populated with existing profile data', () => {
    render(
      <BrowserRouter>
        <EditProfile />
      </BrowserRouter>
    );

    expect(screen.getByDisplayValue('Denzel Washington')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Actor and director.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Relaxing and reading.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('65')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Los Angeles')).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('+254712345678')).toHaveLength(2);
    expect(screen.getByDisplayValue('denzel_w')).toBeInTheDocument();
  });

  it('submits form with mapped interest options and correct data types', async () => {
    render(
      <BrowserRouter>
        <EditProfile />
      </BrowserRouter>
    );

    // Change interestedIn to 'Everyone'
    const everyoneBtn = screen.getByRole('button', { name: /Everyone/i });
    fireEvent.click(everyoneBtn);

    // Click Save Changes
    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: 'Denzel Washington',
          bio: 'Actor and director.',
          age: 65,
          gender: 'Male',
          matchPreferences: expect.objectContaining({
            gender: 'Any', // 'Everyone' is mapped to 'Any'
            maxDistanceKm: 100,
          }),
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });
  });

  it('omits age and gender when they are not populated to prevent backend schema errors', async () => {
    render(
      <BrowserRouter>
        <EditProfile />
      </BrowserRouter>
    );

    // Clear age input
    const ageInput = screen.getByPlaceholderText('28');
    fireEvent.change(ageInput, { target: { value: '' } });

    // Click Save Changes
    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
      const submittedPayload = mockMutateAsync.mock.calls[0][0];
      
      // Ensure age is undefined (omitted) rather than null
      expect(submittedPayload.age).toBeUndefined();
    });
  });
});
