export type StationStatus = 'heavy' | 'moderate' | 'flowing';

export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  status: StationStatus;
  reportCount: number;
  lastUpdated: string;
  source?: 'manual' | 'google_places';
}

export interface StatusReport {
  stationId: string;
  status: StationStatus;
}
