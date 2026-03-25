import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore'
import dotenv from 'dotenv'
dotenv.config()

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
const LAGOS_CENTER = { lat: 6.5244, lng: 3.3792 }
const RADIUS = 20000 // 20km radius around Lagos center

// Google Places API — Nearby Search
async function fetchBusStops(
  pageToken?: string
): Promise<any[]> {
  const baseUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
  
  const params = new URLSearchParams({
    location: `${LAGOS_CENTER.lat},${LAGOS_CENTER.lng}`,
    radius: String(RADIUS),
    type: 'bus_station',
    key: GOOGLE_API_KEY!,
    ...(pageToken && { pagetoken: pageToken }),
  })

  const response = await fetch(`${baseUrl}?${params}`)
  const data = await response.json()
  
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    console.error('Places API error:', data.status, data.error_message)
    return []
  }

  let results = data.results || []

  // Handle pagination — Places API returns max 20 per page
  // up to 3 pages = 60 results max
  if (data.next_page_token) {
    // Must wait 2 seconds before using next_page_token
    console.log('Fetching next page...')
    await new Promise(resolve => setTimeout(resolve, 2500))
    const nextPage = await fetchBusStops(data.next_page_token)
    results = [...results, ...nextPage]
  }

  return results
}

async function seedStations() {
  console.log('Fetching real Lagos bus stops from Google Places...')
  
  const places = await fetchBusStops()
  console.log(`Found ${places.length} bus stops`)

  if (places.length === 0) {
    console.log('No results — check your API key and Places API is enabled')
    process.exit(1)
  }

  // Also search for motor parks and transit stations
  const transitParams = new URLSearchParams({
    location: `${LAGOS_CENTER.lat},${LAGOS_CENTER.lng}`,
    radius: String(RADIUS),
    type: 'transit_station',
    key: GOOGLE_API_KEY!,
  })
  
  const transitResponse = await fetch(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${transitParams}`
  )
  const transitData = await transitResponse.json()
  const transitPlaces = transitData.results || []
  console.log(`Found ${transitPlaces.length} transit stations`)

  // Combine and deduplicate by place_id
  const allPlaces = [...places, ...transitPlaces]
  const unique = Array.from(
    new Map(allPlaces.map(p => [p.place_id, p])).values()
  )
  console.log(`Total unique stations: ${unique.length}`)

  // Seed each station into Firestore
  const statuses = ['heavy', 'moderate', 'flowing']
  let count = 0

  for (const place of unique) {
    const station = {
      id: place.place_id,
      name: place.name,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      address: place.vicinity || '',
      status: statuses[Math.floor(Math.random() * statuses.length)],
      reportCount: Math.floor(Math.random() * 20),
      lastUpdated: new Date().toISOString(),
      source: 'google_places',
    }

    await setDoc(
      doc(db, 'stations', place.place_id), 
      station
    )
    console.log(`✓ ${place.name}`)
    count++
  }

  console.log(`\nDone! Seeded ${count} real Lagos stations into Firestore.`)
  process.exit(0)
}

seedStations().catch(console.error)
