import client from './client';
import type { ApiResponse, User } from '@/types';

interface AuthResponse {
  user: User;
  accessToken: string;
}

export const authApi = {
  register: async (name: string, email: string, password: string) => {
    const { data } = await client.post<ApiResponse<AuthResponse>>('/auth/register', {
      name,
      email,
      password,
    });
    return data.data!;
  },

  login: async (email: string, password: string) => {
    const { data } = await client.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    });
    return data.data!;
  },

  logout: async () => {
    await client.post('/auth/logout');
  },

  getMe: async () => {
    const { data } = await client.get<ApiResponse<User>>('/auth/me');
    return data.data!;
  },

  refresh: async () => {
    const { data } = await client.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
    return data.data!;
  },
};
