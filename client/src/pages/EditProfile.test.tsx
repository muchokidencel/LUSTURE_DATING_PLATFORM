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

vi.mock('../components/PhotoUploader', () => ({
  default: () => <div data-testid="photo-uploader">PhotoUploader Mock</div>,
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
    expect(screen.getByDisplayValue('+254712345678')).toBeInTheDocument();
    expect(screen.getByDisplayValue('712345678')).toBeInTheDocument();
    expect(screen.getByDisplayValue('denzel_w')).toBeInTheDocument();
  }, 10000);

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
    }, { timeout: 10000 });
  }, 15000);

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
    }, { timeout: 10000 });
  }, 15000);

  it('blocks saving with an empty display name and shows an error instead of silently failing', async () => {
    render(
      <BrowserRouter>
        <EditProfile />
      </BrowserRouter>
    );

    const nameInput = screen.getByDisplayValue('Denzel Washington');
    fireEvent.change(nameInput, { target: { value: '' } });

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('Display name is required.')).toBeInTheDocument();
    });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  }, 15000);

  it('shows the server validation message when the save request fails', async () => {
    mockMutateAsync.mockRejectedValueOnce({
      response: { data: { status: 'error', errors: [{ path: 'displayName', message: 'Display name is required' }] } },
    });

    render(
      <BrowserRouter>
        <EditProfile />
      </BrowserRouter>
    );

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('Display name is required')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  }, 15000);

  it('does not render duplicate Looking For / Relationship Intent dropdown under Matchmaking', () => {
    render(
      <BrowserRouter>
        <EditProfile />
      </BrowserRouter>
    );

    expect(screen.queryByLabelText(/Looking For \(Relationship Intent\)/i)).not.toBeInTheDocument();
  });

  it('submits form with intent and intentPreference synchronized to the selected relationship preference', async () => {
    render(
      <BrowserRouter>
        <EditProfile />
      </BrowserRouter>
    );

    const intentSelect = screen.getByLabelText(/Relationship Preference/i);
    fireEvent.change(intentSelect, { target: { value: 'casual' } });

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          intent: 'casual',
          matchPreferences: expect.objectContaining({
            intent: 'casual',
          }),
        })
      );
    });
  });

  it('displays M-Pesa phone number without the +254 country code', () => {
    render(
      <BrowserRouter>
        <EditProfile />
      </BrowserRouter>
    );
    // Profile data has whatsapp: '+254712345678'
    const mpesaInput = screen.getByPlaceholderText('712 345 678');
    expect(mpesaInput).toHaveValue('712345678');
  });

  it('updates whatsapp state with prefix +254 when M-Pesa input is edited', async () => {
    render(
      <BrowserRouter>
        <EditProfile />
      </BrowserRouter>
    );

    const mpesaInput = screen.getByPlaceholderText('712 345 678');
    fireEvent.change(mpesaInput, { target: { value: '722222222' } });

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          whatsapp: '+254722222222',
        })
      );
    });
  });

  it('sanitizes leading 0, 254, or +254 in M-Pesa input', async () => {
    render(
      <BrowserRouter>
        <EditProfile />
      </BrowserRouter>
    );

    const mpesaInput = screen.getByPlaceholderText('712 345 678');
    
    // Type "0722222222"
    fireEvent.change(mpesaInput, { target: { value: '0722222222' } });
    expect(mpesaInput).toHaveValue('722222222');

    // Type "+254722222222"
    fireEvent.change(mpesaInput, { target: { value: '+254722222222' } });
    expect(mpesaInput).toHaveValue('722222222');

    // Type "254722222222"
    fireEvent.change(mpesaInput, { target: { value: '254722222222' } });
    expect(mpesaInput).toHaveValue('722222222');
  });
});
