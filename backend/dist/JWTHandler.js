import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in the environment variables');
}
const secret = JWT_SECRET;
export function issueToken(payload, expiresIn = '1h') {
    return jwt.sign(payload, secret, { expiresIn });
}
export function validateToken(token) {
    return jwt.verify(token, secret);
}
//# sourceMappingURL=JWTHandler.js.map