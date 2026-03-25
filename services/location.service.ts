import * as Location from 'expo-location'
import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Station } from '@/types/station'
import { GEOFENCE_RADIUS_METRES, PROXIMITY_TASK_NAME, MIN_MINUTES_BETWEEN_PROMPTS } from '@/constants/geofence'

const LAST_PROMPTED_KEY = 'movepal_last_prompted'

// Calculate distance between two coordinates in metres
export const getDistanceMetres = (
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number => {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Find nearest station to current location
export const findNearestStation = (
  userLat: number,
  userLng: number,
  stations: Station[]
): { station: Station; distance: number } | null => {
  let nearest: Station | null = null
  let minDistance = Infinity

  for (const station of stations) {
    const distance = getDistanceMetres(
      userLat, userLng,
      station.lat, station.lng
    )
    if (distance < minDistance) {
      minDistance = distance
      nearest = station
    }
  }

  if (!nearest) return null
  return { station: nearest, distance: minDistance }
}

// Check if we recently prompted user for this station
export const wasRecentlyPrompted = async (
  stationId: string
): Promise<boolean> => {
  try {
    const raw = await AsyncStorage.getItem(LAST_PROMPTED_KEY)
    if (!raw) return false
    const record = JSON.parse(raw)
    const lastTime = record[stationId]
    if (!lastTime) return false
    const minutesSince = (Date.now() - lastTime) / 1000 / 60
    return minutesSince < MIN_MINUTES_BETWEEN_PROMPTS
  } catch {
    return false
  }
}

// Record that we prompted for this station
export const recordPrompted = async (
  stationId: string
): Promise<void> => {
  try {
    const raw = await AsyncStorage.getItem(LAST_PROMPTED_KEY)
    const record = raw ? JSON.parse(raw) : {}
    record[stationId] = Date.now()
    await AsyncStorage.setItem(
      LAST_PROMPTED_KEY, 
      JSON.stringify(record)
    )
  } catch {}
}

// Send proximity notification for a station
export const sendProximityNotification = async (
  station: Station,
  distance: number
): Promise<void> => {
  const alreadyPrompted = await wasRecentlyPrompted(station.id)
  if (alreadyPrompted) return

  await recordPrompted(station.id)

  const distanceText = distance < 100
    ? 'You are right at'
    : `You are ${Math.round(distance)}m from`

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📍 Quick report needed — MovePal',
      body: `${distanceText} ${station.name}. How does it look right now?`,
      data: {
        type: 'proximity_report',
        stationId: station.id,
        stationName: station.name,
        stationLat: station.lat,
        stationLng: station.lng,
      },
      categoryIdentifier: 'STATION_REPORT',
    },
    trigger: null,
  })
}

// Request always-on location permission
export const requestAlwaysOnLocation = async (): Promise<boolean> => {
  const { status: foreground } = 
    await Location.requestForegroundPermissionsAsync()
  if (foreground !== 'granted') return false

  const { status: background } = 
    await Location.requestBackgroundPermissionsAsync()
  return background === 'granted'
}
