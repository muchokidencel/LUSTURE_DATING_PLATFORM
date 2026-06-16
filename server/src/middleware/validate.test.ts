import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validate } from './validate';
import { z } from 'zod';

describe('Validate Middleware', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  it('should call next if validation passes', async () => {
    const schema = z.object({ name: z.string() });
    req.body = { name: 'Test' };
    const middleware = validate(schema as any);

    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 if validation fails', async () => {
    const schema = z.object({ name: z.string() });
    req.body = { name: 123 };
    const middleware = validate(schema as any);

    await middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });
});
