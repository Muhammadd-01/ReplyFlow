import client from './client';
import type { ApiResponse, User } from '@/types';

interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export const authApi = {
  register: async (name: string, email: string, password: string) => {
    const { data } = await client.post<ApiResponse<AuthResponse>>('/auth/register', {
      name,
      email,
      password,
    });
    return { user: data.data!.user, accessToken: data.data!.tokens.accessToken, refreshToken: data.data!.tokens.refreshToken };
  },

  login: async (email: string, password: string) => {
    const { data } = await client.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    });
    return { user: data.data!.user, accessToken: data.data!.tokens.accessToken, refreshToken: data.data!.tokens.refreshToken };
  },

  logout: async () => {
    await client.post('/auth/logout');
  },

  getMe: async () => {
    const { data } = await client.get<ApiResponse<{ user: User }>>('/auth/me');
    return data.data!.user;
  },

  refresh: async () => {
    const { data } = await client.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
    return data.data!;
  },
};
