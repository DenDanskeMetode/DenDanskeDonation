import jwt, { SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in the environment variables');
}

const secret: string = JWT_SECRET;

export interface JWTPayload {
  userId: number;
  email: string;
  username: string;
  role: 'user' | 'admin';
}

export function issueToken(payload: JWTPayload, expiresIn: SignOptions['expiresIn'] = '2h'): string {
  return jwt.sign(payload, secret, { expiresIn });
}

export function validateToken(token: string): JWTPayload {
  return jwt.verify(token, secret) as unknown as JWTPayload;
}
