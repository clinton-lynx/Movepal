import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
} from 'firebase/firestore';
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

// Submit a crowd report
export const reportStatus = async (
  stationId: string,
  status: StationStatus
): Promise<void> => {
  // Add report to subcollection
  await addDoc(
    collection(db, 'stations', stationId, 'reports'),
    { status, createdAt: serverTimestamp() }
  );

  // Update station status directly
  const firestoreInstance = await import('firebase/firestore');
  await updateDoc(doc(db, 'stations', stationId), {
    status,
    reportCount: firestoreInstance.increment(1),
    lastUpdated: new Date().toISOString(), // Fallback for lastUpdated format locally or just let component handle date strings
  });
};
