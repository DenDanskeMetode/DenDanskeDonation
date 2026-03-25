import { Request, Response, NextFunction } from 'express';
import { validateToken } from '../services/JWTHandler.js';

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = validateToken(token);
    if (!decoded) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT validation error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}
