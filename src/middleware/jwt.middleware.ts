import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const jwtMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) return res.sendStatus(401);
    console.log('Verifying token:', token);
  try {
    console.log('Before verify', process.env.JWT_SECRET);
    const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
    console.log('after', payload);
    (req as any).userId = payload.sub;
    next();
  } catch (err) {
    console.log('Eroror: ', err);
    return res.sendStatus(403);
  }
};
