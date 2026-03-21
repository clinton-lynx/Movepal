import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from '@/lib/api';

export const notificationService = {
  async requestPermission(): Promise<boolean> {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    // Configure notification handling
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    return true;
  },

  async registerPushToken(userId: string): Promise<void> {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: undefined, // Will use Constants.expoConfig.extra.eas.projectId in production
    });

    await api.post('/notifications/register', {
      userId,
      token: tokenData.data,
      platform: Platform.OS,
    });
  },
};
