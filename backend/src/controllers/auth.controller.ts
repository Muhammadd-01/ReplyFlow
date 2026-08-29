import { Request, Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { AppError, UnauthorizedError, ValidationError } from '../middleware/error-handler.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { hashPassword, comparePasswords, generateTokens, verifyRefreshToken } from '../services/auth.service.js';
import User from '../models/User.js';

export const register = async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new ValidationError('Email already in use');
  }

  const passwordHash = await hashPassword(data.password);
  
  const user = await User.create({
    email: data.email,
    passwordHash,
    name: data.name,
    companyName: data.companyName,
  });

  const { accessToken, refreshToken } = generateTokens(user.id);

  res.status(201).json({
    status: 'success',
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyName: user.companyName,
      },
      tokens: { accessToken, refreshToken },
    },
  });
};

export const login = async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);

  const user = await User.findOne({ email: data.email });
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const isPasswordValid = await comparePasswords(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const { accessToken, refreshToken } = generateTokens(user.id);

  res.json({
    status: 'success',
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyName: user.companyName,
      },
      tokens: { accessToken, refreshToken },
    },
  });
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new UnauthorizedError('Refresh token required');
  
  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.userId);
    
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const tokens = generateTokens(user.id);

    res.json({
      status: 'success',
      data: { tokens },
    });
  } catch (error) {
    throw new UnauthorizedError('Invalid refresh token');
  }
};

export const logout = async (req: Request, res: Response) => {
  res.json({ status: 'success', message: 'Logged out successfully' });
};

export const me = async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw new UnauthorizedError('User not found');

  res.json({
    status: 'success',
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyName: user.companyName,
      }
    }
  });
};
