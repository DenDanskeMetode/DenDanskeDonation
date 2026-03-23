import { issueToken, validateToken } from '../backend/JWTHandler.js';

describe('JWTHandler', () => {
  describe('issueToken', () => {
    it('returns a JWT string with three parts', () => {
      const token = issueToken({ userId: 1, email: 'a@b.com', username: 'foo', role: 'user' as const });
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('encodes the payload correctly', () => {
      const payload = { userId: 42, email: 'user@test.com', username: 'testuser', role: 'user' as const };
      const token = issueToken(payload);
      const decoded = validateToken(token);
      expect(decoded.userId).toBe(42);
      expect(decoded.email).toBe('user@test.com');
      expect(decoded.username).toBe('testuser');
    });
  });

  describe('validateToken', () => {
    it('returns the correct payload for a valid token', () => {
      const payload = { userId: 1, email: 'a@b.com', username: 'foo', role: 'user' as const };
      const token = issueToken(payload);
      const decoded = validateToken(token);
      expect(decoded.userId).toBe(1);
      expect(decoded.email).toBe('a@b.com');
      expect(decoded.username).toBe('foo');
    });

    it('throws on a completely invalid token string', () => {
      expect(() => validateToken('not.a.valid.token')).toThrow();
    });

    it('throws on a token signed with a different secret', () => {
      const fakeToken = require('jsonwebtoken').sign({ userId: 1 }, 'wrong-secret');
      expect(() => validateToken(fakeToken)).toThrow();
    });

    it('throws on an expired token', () => {
      const token = issueToken({ userId: 1, email: 'a@b.com', username: 'foo', role: 'user' as const }, '-1s');
      expect(() => validateToken(token)).toThrow();
    });
  });
});
