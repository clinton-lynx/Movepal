import * as SecureStore from 'expo-secure-store';
import { User } from '@/types/auth';

const Keys = {
  AUTH_TOKEN: 'AUTH_TOKEN',
  USER_PROFILE: 'USER_PROFILE',
} as const;

export const storage = {
  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(Keys.AUTH_TOKEN);
  },

  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(Keys.AUTH_TOKEN, token);
  },

  async removeToken(): Promise<void> {
    await SecureStore.deleteItemAsync(Keys.AUTH_TOKEN);
  },

  async getUser(): Promise<User | null> {
    const raw = await SecureStore.getItemAsync(Keys.USER_PROFILE);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  async setUser(user: User): Promise<void> {
    await SecureStore.setItemAsync(Keys.USER_PROFILE, JSON.stringify(user));
  },

  async removeUser(): Promise<void> {
    await SecureStore.deleteItemAsync(Keys.USER_PROFILE);
  },
};
