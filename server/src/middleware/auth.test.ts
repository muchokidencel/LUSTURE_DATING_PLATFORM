import { authenticate, authenticateOptional } from './auth';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('should return 401 if no authorization header', async () => {
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
  });

  it('should return 401 if invalid token', async () => {
    req.headers.authorization = 'Bearer invalid-token';
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('invalid token');
    });

    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
  });

  it('should call next and set user if valid token', async () => {
    req.headers.authorization = 'Bearer valid-token';
    const user = { id: 1, email: 'test@test.com', role: 'user' };
    vi.mocked(jwt.verify).mockReturnValue(user as any);

    await authenticate(req, res, next);
    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalled();
  });

  describe('authenticateOptional', () => {
    it('should call next and not set user if no authorization header', async () => {
      await authenticateOptional(req, res, next);
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should call next and not set user if invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('invalid token');
      });

      await authenticateOptional(req, res, next);
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should call next and set user if valid token', async () => {
      req.headers.authorization = 'Bearer valid-token';
      const user = { id: 1, email: 'test@test.com', role: 'user' };
      vi.mocked(jwt.verify).mockReturnValue(user as any);

      await authenticateOptional(req, res, next);
      expect(req.user).toEqual(user);
      expect(next).toHaveBeenCalled();
    });
  });
});
