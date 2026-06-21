import { describe, it, expect } from 'vitest';
import { cloudinaryThumb } from './cloudinary';

describe('cloudinaryThumb', () => {
  it('inserts a sized transformation into a Cloudinary delivery URL', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1700000000/abc123.jpg';
    expect(cloudinaryThumb(url, 80)).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_80,h_80,c_fill,g_face,q_auto,f_auto/v1700000000/abc123.jpg'
    );
  });

  it('passes through non-Cloudinary URLs unchanged', () => {
    expect(cloudinaryThumb('match1.jpg', 80)).toBe('match1.jpg');
    expect(cloudinaryThumb('https://images.unsplash.com/photo-123', 80)).toBe('https://images.unsplash.com/photo-123');
  });

  it('returns undefined for nullish input', () => {
    expect(cloudinaryThumb(undefined, 80)).toBeUndefined();
    expect(cloudinaryThumb(null, 80)).toBeUndefined();
    expect(cloudinaryThumb('', 80)).toBeUndefined();
  });
});
