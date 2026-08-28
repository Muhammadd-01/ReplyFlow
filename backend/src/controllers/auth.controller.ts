import { Request, Response } from 'express';
import { env } from '../config/env.js';
import * as authService from '../services/auth.service.js';
import { AuthRequest } from '../types/index.js';
import { UnauthorizedError } from '../middleware/error-handler.js';

export const register = async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(201).json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
};

export const login = async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
};

export const me = async (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: req.user });
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  
  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token required');
  }
  
  const tokens = await authService.refreshTokens(refreshToken);
  
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  
  res.json({
    success: true,
    data: { accessToken: tokens.accessToken }
  });
};
