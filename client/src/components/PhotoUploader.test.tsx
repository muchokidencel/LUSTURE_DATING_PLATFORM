import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PhotoUploader from './PhotoUploader';
import { useUploadPhoto, useDeletePhoto } from '../hooks/useQueries';
import { compressImage } from '../utils/imageCompressor';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../hooks/useQueries', () => ({
  useUploadPhoto: vi.fn(),
  useDeletePhoto: vi.fn(),
}));

vi.mock('../utils/imageCompressor', () => ({
  compressImage: vi.fn(),
}));

// Mock Dialog as it might use Radix UI which can be tricky in jsdom without proper setup
vi.mock('./ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
}));

describe('PhotoUploader', () => {
  const mockPhotos = [
    { url: 'photo1.jpg', public_id: '1' },
    { url: 'photo2.jpg', public_id: '2' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useUploadPhoto as any).mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    (useDeletePhoto as any).mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  });

  it('renders correctly with given photos', () => {
    render(<PhotoUploader photos={mockPhotos} />);
    expect(screen.getByText('2 / 6 uploaded')).toBeInTheDocument();
    expect(screen.getByText('Cover Photo')).toBeInTheDocument();
  });

  it('shows add photo slots for remaining slots', () => {
    render(<PhotoUploader photos={mockPhotos} />);
    const addPhotoButtons = screen.getAllByText('Add Photo');
    expect(addPhotoButtons).toHaveLength(4); // 6 total - 2 existing
  });

  it('handles file upload correctly', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    (useUploadPhoto as any).mockReturnValue({ mutateAsync, isPending: false });
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
    (compressImage as any).mockResolvedValue(mockBlob);

    render(<PhotoUploader photos={mockPhotos} />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(hiddenInput, { target: { files: [file] } });

    await waitFor(() => expect(compressImage).toHaveBeenCalledWith(file));
    expect(mutateAsync).toHaveBeenCalledWith(mockBlob);
  });

  it('handles compression error during upload', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (compressImage as any).mockRejectedValue(new Error('Compression failed'));

    render(<PhotoUploader photos={mockPhotos} />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(hiddenInput, { target: { files: [file] } });

    await waitFor(() => expect(compressImage).toHaveBeenCalledWith(file));
    expect(consoleSpy).toHaveBeenCalledWith('Upload failed:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('opens delete confirmation dialog and handles deletion', async () => {
    const deleteMutateAsync = vi.fn().mockResolvedValue({});
    (useDeletePhoto as any).mockReturnValue({ mutateAsync: deleteMutateAsync, isPending: false });

    render(<PhotoUploader photos={mockPhotos} />);
    
    // Find trash icon buttons. Lucide icons have a data-testid or can be found by their class/svg
    const deleteButtons = document.querySelectorAll('button');
    const firstPhotoDeleteBtn = Array.from(deleteButtons).find(btn => btn.querySelector('.lucide-trash2'));
    
    if (!firstPhotoDeleteBtn) throw new Error('Delete button not found');
    fireEvent.click(firstPhotoDeleteBtn);

    expect(screen.getByText('Delete Photo?')).toBeInTheDocument();
    
    const confirmDeleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(confirmDeleteButton);

    await waitFor(() => expect(deleteMutateAsync).toHaveBeenCalledWith('1'));
  });

  it('closes delete dialog when cancel is clicked', async () => {
    render(<PhotoUploader photos={mockPhotos} />);
    
    const deleteButtons = document.querySelectorAll('button');
    const firstPhotoDeleteBtn = Array.from(deleteButtons).find(btn => btn.querySelector('.lucide-trash2'));
    
    if (!firstPhotoDeleteBtn) throw new Error('Delete button not found');
    fireEvent.click(firstPhotoDeleteBtn);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Delete Photo?')).not.toBeInTheDocument();
  });
});
