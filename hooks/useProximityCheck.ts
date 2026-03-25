import { useEffect, useRef } from 'react'
import * as Location from 'expo-location'
import { Station } from '@/types/station'
import { 
  findNearestStation, 
  sendProximityNotification 
} from '@/services/location.service'
import { GEOFENCE_RADIUS_METRES } from '@/constants/geofence'


export const useProximityCheck = (
  stations: Station[], 
  onNearbyStation: (id: string | null) => void
) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (stations.length === 0) return

    const checkProximity = async () => {
      try {
        const { status } = 
          await Location.getForegroundPermissionsAsync()
        if (status !== 'granted') return

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })

        const { latitude, longitude } = location.coords
        const nearest = findNearestStation(
          latitude, longitude, stations
        )

        if (
          nearest && 
          nearest.distance <= GEOFENCE_RADIUS_METRES
        ) {
          onNearbyStation(nearest.station.id)
          await sendProximityNotification(
            nearest.station, 
            nearest.distance
          )
        } else {
          onNearbyStation(null)
        }
      } catch (err) {
        console.error('Proximity check failed:', err)
      }
    }

    // Check every 5 minutes while app is open
    checkProximity()
    intervalRef.current = setInterval(checkProximity, 5 * 60 * 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [stations])
}
