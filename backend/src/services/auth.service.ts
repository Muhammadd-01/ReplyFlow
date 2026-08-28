import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { UnauthorizedError, ValidationError } from '../middleware/error-handler.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { z } from 'zod';

export const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  });

  const refreshToken = jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET) as { userId: string };
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
};

export const register = async (data: z.infer<typeof registerSchema>) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new ValidationError('Email already registered');
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
    },
  });

  const tokens = generateTokens(user.id);
  const { passwordHash: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, ...tokens };
};

export const login = async (data: z.infer<typeof loginSchema>) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const tokens = generateTokens(user.id);
  const { passwordHash: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, ...tokens };
};

export const refreshTokens = async (token: string) => {
  try {
    const decoded = verifyRefreshToken(token);
    return generateTokens(decoded.userId);
  } catch (error) {
    throw new UnauthorizedError('Invalid refresh token');
  }
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  
  if (!user) {
    throw new UnauthorizedError('User not found');
  }
  
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
