import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export const jwtMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Missing authorization token' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload & { sub?: string };
    const userId = payload.sub;
    if (!userId || typeof userId !== 'string') {
      return res.status(403).json({ message: 'Invalid token subject' });
    }
    (req as Request & { userId?: string }).userId = userId;
    next();
  } catch {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};
