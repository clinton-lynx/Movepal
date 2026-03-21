export type StationStatus = 'heavy' | 'moderate' | 'flowing';

export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: StationStatus;
  reportCount: number;
  lastUpdated: string;
}

export interface StatusReport {
  stationId: string;
  status: StationStatus;
}
