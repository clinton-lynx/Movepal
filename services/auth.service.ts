import api from '@/lib/api';
import { storage } from '@/lib/storage';
import { AuthResponse, User } from '@/types/auth';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    const { token, user } = response.data.data;
    await storage.setToken(token);
    await storage.setUser(user);
    return { token, user };
  },

  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
    });
    const { token, user } = response.data.data;
    await storage.setToken(token);
    await storage.setUser(user);
    return { token, user };
  },

  async logout(): Promise<void> {
    await storage.removeToken();
    await storage.removeUser();
  },

  async getCurrentUser(): Promise<User | null> {
    return storage.getUser();
  },
};
