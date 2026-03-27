import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { db } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export const registerForPushNotifications = async (
  userId: string
): Promise<string | null> => {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device')
    return null
  }

  const { status: existingStatus } = 
    await Notifications.getPermissionsAsync()
  
  let finalStatus = existingStatus
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied')
    finalStatus = (await Notifications.requestPermissionsAsync()).status;
    if (finalStatus !== 'granted') {
      return null;
    }
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  const token = (await Notifications.getExpoPushTokenAsync({
    projectId,
  })).data

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    })
  }

  // Save token to Firestore against user
  if (userId) {
    try {
      await setDoc(doc(db, 'users', userId), {
        pushToken: token,
        updatedAt: new Date().toISOString(),
      }, { merge: true })
    } catch (error) {
      console.error('Error updating push token in Firestore:', error)
    }
  }

  console.log('Push token registered:', token)
  return token
}

export const sendLocalNotification = async (
  title: string,
  body: string,
) => {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null, // null = show immediately
  })
}
