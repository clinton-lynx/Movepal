import api from '@/lib/api';
import { storage } from '@/lib/storage';
import { AuthResponse, User } from '@/types/auth';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    await storage.setToken(data.token);
    await storage.setUser(data.user);
    return data;
  },

  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', {
      name,
      email,
      password,
    });
    await storage.setToken(data.token);
    await storage.setUser(data.user);
    return data;
  },

  async logout(): Promise<void> {
    await storage.removeToken();
    await storage.removeUser();
  },

  async getCurrentUser(): Promise<User | null> {
    return storage.getUser();
  },
};
