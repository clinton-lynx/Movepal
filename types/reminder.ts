export interface Reminder {
  id: string
  stationId: string
  stationName: string
  stationLat: number
  stationLng: number
  hour: number
  minute: number
  enabled: boolean
  createdAt: string
}
