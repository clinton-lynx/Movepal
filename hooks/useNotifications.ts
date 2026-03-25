import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import * as Notifications from 'expo-notifications'
import { registerForPushNotifications, sendLocalNotification } from '@/services/notification.service'
import { subscribeToStations } from '@/services/stations.service'
import { Station } from '@/types/station'

export const useNotifications = (userId: string) => {
  const previousStations = useRef<Record<string, string>>({})
  const notificationListener = useRef<Notifications.Subscription | null>(null)
  const responseListener = useRef<Notifications.Subscription | null>(null)

  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications(userId)

    // Listen for incoming notifications
    notificationListener.current = 
      Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification)
      })

    // Listen for notification taps
    responseListener.current = 
      Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification tapped:', response)
      })

    // Watch station status changes
    const unsubscribe = subscribeToStations(async (stations: Station[]) => {
      for (const station of stations) {
        // Find if this specific station's status actually changed from our last record
        const previousStatus = previousStations.current[station.id]
        
        // If station just became heavy and wasn't heavy before
        if (
          station.status === 'heavy' && 
          previousStatus && 
          previousStatus !== 'heavy'
        ) {
          await sendLocalNotification(
            '🚨 Station Alert — MovePal',
            `${station.name} is now heavily congested. Consider an alternative route.`
          )
        }

        // If station cleared up
        if (
          station.status === 'flowing' && 
          previousStatus === 'heavy'
        ) {
          await sendLocalNotification(
            '✅ Station Cleared — MovePal',
            `${station.name} is now flowing. Good time to head out!`
          )
        }

        previousStations.current[station.id] = station.status
      }
    })

    return () => {
      unsubscribe()
      notificationListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [userId])
}
