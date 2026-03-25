import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import { Reminder } from '@/types/reminder'

const REMINDERS_KEY = 'movepal_reminders'

export const reminderService = {

  async getAll(): Promise<Reminder[]> {
    try {
      const raw = await AsyncStorage.getItem(REMINDERS_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  },

  async save(reminder: Reminder): Promise<void> {
    const all = await this.getAll()
    const existing = all.findIndex(r => r.id === reminder.id)
    if (existing >= 0) {
      all[existing] = reminder
    } else {
      all.push(reminder)
    }
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(all))
    await this.scheduleNotification(reminder)
  },

  async remove(reminderId: string): Promise<void> {
    const all = await this.getAll()
    const filtered = all.filter(r => r.id !== reminderId)
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(filtered))
    await Notifications.cancelScheduledNotificationAsync(reminderId)
  },

  async scheduleNotification(reminder: Reminder): Promise<void> {
    // Cancel existing notification for this reminder
    await Notifications.cancelScheduledNotificationAsync(reminder.id)
    
    if (!reminder.enabled) return

    // Schedule daily repeating notification
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: {
        title: '🚌 MovePal Commute Check',
        body: `Checking ${reminder.stationName} status for your commute...`,
        data: { 
          stationId: reminder.stationId,
          stationLat: reminder.stationLat,
          stationLng: reminder.stationLng,
          stationName: reminder.stationName,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: reminder.hour,
        minute: reminder.minute,
        repeats: true,
      },

    })
  },

  formatTime(hour: number, minute: number): string {
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    const displayMinute = minute.toString().padStart(2, '0')
    return `${displayHour}:${displayMinute} ${period}`
  }
}
