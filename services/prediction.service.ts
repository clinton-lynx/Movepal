import { StationStatus } from '@/types/station'

const ML_URL = 'https://movepal-ml.onrender.com'

export interface Prediction {
  status: StationStatus
  confidence: number
}

export const predictStation = async (
  lat: number,
  lng: number
): Promise<Prediction | null> => {
  try {
    const response = await fetch(`${ML_URL}/predict/now`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng })
    })
    const data = await response.json()
    if (data.success) return data.data
    return null
  } catch {
    return null
  }
}

