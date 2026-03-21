import * as dotenv from 'dotenv';
dotenv.config();

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const stations = [
  { id:'1', name:'Oshodi Terminal',    lat:6.5570, lng:3.3500, status:'heavy',    reportCount:14, lastUpdated: new Date().toISOString() },
  { id:'2', name:'Mile 2',             lat:6.4698, lng:3.3023, status:'moderate', reportCount:7,  lastUpdated: new Date().toISOString() },
  { id:'3', name:'Ikeja Under Bridge', lat:6.5958, lng:3.3403, status:'flowing',  reportCount:3,  lastUpdated: new Date().toISOString() },
  { id:'4', name:'Ojota',             lat:6.5952, lng:3.3831, status:'heavy',    reportCount:11, lastUpdated: new Date().toISOString() },
  { id:'5', name:'Berger',            lat:6.6349, lng:3.3782, status:'moderate', reportCount:5,  lastUpdated: new Date().toISOString() },
  { id:'6', name:'CMS Marina',        lat:6.4505, lng:3.3958, status:'flowing',  reportCount:2,  lastUpdated: new Date().toISOString() },
];

async function seed() {
  for (const station of stations) {
    await setDoc(doc(db, 'stations', station.id), station);
    console.log(`Seeded: ${station.name}`);
  }
  console.log('Done!');
  process.exit(0);
}

seed();
