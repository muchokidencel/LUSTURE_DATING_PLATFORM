import { describe, it, expect } from 'vitest';
import cloudinary from './cloudinary';

describe('Cloudinary Config', () => {
  it('should be configured', () => {
    expect(cloudinary.config()).toBeDefined();
  });
});
