import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compressImage } from './imageCompressor';

// Class-based constructor mock for FileReader
class MockFileReader {
  onload: any = null;
  onerror: any = null;
  result = 'data:image/jpeg;base64,mock';

  readAsDataURL(file: File) {
    if (file.name === 'error-read.jpg') {
      setTimeout(() => {
        if (this.onerror) this.onerror(new Error('Failed to read'));
      }, 0);
    } else {
      setTimeout(() => {
        if (this.onload) {
          this.onload({ target: { result: file.name === 'error-load.jpg' ? 'error-src' : this.result } } as any);
        }
      }, 0);
    }
  }
}

// Class-based constructor mock for Image
class MockImage {
  onload: any = null;
  onerror: any = null;
  width = 1000;
  height = 1000;

  set src(val: string) {
    if (val === 'error-src') {
      setTimeout(() => {
        if (this.onerror) this.onerror(new Error('Failed to load'));
      }, 0);
    } else {
      setTimeout(() => {
        if (this.onload) this.onload();
      }, 0);
    }
  }
}

describe('imageCompressor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('FileReader', MockFileReader);
    vi.stubGlobal('Image', MockImage);
  });

  it('should reject invalid file types', async () => {
    const file = new File([''], 'test.txt', { type: 'text/plain' });
    await expect(compressImage(file)).rejects.toThrow('Invalid file type');
  });

  it('should reject large files', async () => {
    const file = new File(['a'.repeat(6 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });
    
    await expect(compressImage(file)).rejects.toThrow('File is too large');
  });

  it('should compress a valid image successfully', async () => {
    const file = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 });

    // Mock Canvas
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: () => ({
        drawImage: vi.fn(),
      }),
      toBlob: (callback: any) => {
        callback(new Blob(['compressed-image'], { type: 'image/jpeg' }));
      }
    };
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return mockCanvas as any;
      return {} as any;
    });

    const result = await compressImage(file);
    expect(result).toBeInstanceOf(Blob);
  });

  it('should reject if FileReader fails', async () => {
    const file = new File([''], 'error-read.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 });

    await expect(compressImage(file)).rejects.toThrow('Failed to read file');
  });

  it('should reject if Image loading fails', async () => {
    const file = new File([''], 'error-load.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 });

    await expect(compressImage(file)).rejects.toThrow('Failed to load image');
  });

  it('should reject if Canvas context fails to initialize', async () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 });

    const mockCanvas = {
      getContext: () => null,
    };
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return mockCanvas as any;
      return {} as any;
    });

    await expect(compressImage(file)).rejects.toThrow('Failed to get canvas context');
  });
});
