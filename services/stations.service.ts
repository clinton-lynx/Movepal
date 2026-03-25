import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  query,
} from 'firebase/firestore';
import api from '@/lib/api';
import { Station, StationStatus } from '@/types/station';

// Real-time listener — returns unsubscribe function
export const subscribeToStations = (
  onUpdate: (stations: Station[]) => void
): (() => void) => {
  const q = query(collection(db, 'stations'));
  return onSnapshot(q, (snapshot) => {
    const stations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Station[];
    onUpdate(stations);
  });
};

// Submit a crowd report via backend API
export const reportStatus = async (
  stationId: string,
  status: StationStatus
): Promise<void> => {
  const response = await api.post(
    `/stations/${stationId}/report`,
    { status }
  );
  if (!response.data.success) {
    throw new Error(response.data.message);
  }
};
