import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { UnauthorizedError } from './error-handler.js';
import { verifyAccessToken } from '../services/auth.service.js';
import User from '../models/User.js';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid token');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.userId);
    
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name || null,
      companyName: user.companyName || null,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    next();
  } catch (error) {
    next(new UnauthorizedError('Authentication failed'));
  }
};
