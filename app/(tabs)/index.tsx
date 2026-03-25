import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Alert,
  Linking,
  TextInput,
  Image,
  Easing,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subscribeToStations } from '@/services/stations.service';
import { Station, StationStatus } from '@/types/station';
import { STATUS_COLOR, STATUS_LABEL } from '@/constants/stations';
import StatusBadge from '@/components/StatusBadge';
import * as Location from 'expo-location';
import { useProximityCheck } from '@/hooks/useProximityCheck';
import { StationBottomSheet } from '@/components/StationBottomSheet';

import { SvgXml } from 'react-native-svg';

const MARKER_XML: Record<string, string> = {
  heavy: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
  <ellipse cx="20" cy="50" rx="7" ry="3" fill="rgba(0,0,0,0.25)"/>
  <path d="M20 2C12.3 2 6 8.3 6 16C6 27 20 50 20 50S34 27 34 16C34 8.3 27.7 2 20 2Z" fill="#EF4444"/>
  <circle cx="20" cy="16" r="10" fill="rgba(255,255,255,0.15)"/>
  <rect x="12" y="12" width="16" height="10" rx="2.5" fill="none" stroke="white" stroke-width="1.8"/>
  <line x1="12" y1="16" x2="28" y2="16" stroke="white" stroke-width="1"/>
  <circle cx="15" cy="22" r="2" fill="#EF4444" stroke="white" stroke-width="1.5"/>
  <circle cx="25" cy="22" r="2" fill="#EF4444" stroke="white" stroke-width="1.5"/>
  <rect x="18" y="17" width="4" height="5" rx="1" fill="rgba(255,255,255,0.35)"/>
</svg>`,
  moderate: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
  <ellipse cx="20" cy="50" rx="7" ry="3" fill="rgba(0,0,0,0.25)"/>
  <path d="M20 2C12.3 2 6 8.3 6 16C6 27 20 50 20 50S34 27 34 16C34 8.3 27.7 2 20 2Z" fill="#F97316"/>
  <circle cx="20" cy="16" r="10" fill="rgba(255,255,255,0.15)"/>
  <rect x="12" y="12" width="16" height="10" rx="2.5" fill="none" stroke="white" stroke-width="1.8"/>
  <line x1="12" y1="16" x2="28" y2="16" stroke="white" stroke-width="1"/>
  <circle cx="15" cy="22" r="2" fill="#F97316" stroke="white" stroke-width="1.5"/>
  <circle cx="25" cy="22" r="2" fill="#F97316" stroke="white" stroke-width="1.5"/>
  <rect x="18" y="17" width="4" height="5" rx="1" fill="rgba(255,255,255,0.35)"/>
</svg>`,
  flowing: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
  <ellipse cx="20" cy="50" rx="7" ry="3" fill="rgba(0,0,0,0.25)"/>
  <path d="M20 2C12.3 2 6 8.3 6 16C6 27 20 50 20 50S34 27 34 16C34 8.3 27.7 2 20 2Z" fill="#22C55E"/>
  <circle cx="20" cy="16" r="10" fill="rgba(255,255,255,0.15)"/>
  <rect x="12" y="12" width="16" height="10" rx="2.5" fill="none" stroke="white" stroke-width="1.8"/>
  <line x1="12" y1="16" x2="28" y2="16" stroke="white" stroke-width="1"/>
  <circle cx="15" cy="22" r="2" fill="#22C55E" stroke="white" stroke-width="1.5"/>
  <circle cx="25" cy="22" r="2" fill="#22C55E" stroke="white" stroke-width="1.5"/>
  <rect x="18" y="17" width="4" height="5" rx="1" fill="rgba(255,255,255,0.35)"/>
</svg>`,
};

const { height, width } = Dimensions.get('window');

const customMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0a0f1e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#030816' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#0f2040' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#1e3a5a' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1e3a5a' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#60A5FA' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#030d1a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3B82F6' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1e3a5a' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#060d1c' }] },
];

function AnimatedMarker({ 
  station, 
  onPress, 
  isNearby 
}: { 
  station: Station; 
  onPress: () => void;
  isNearby?: boolean;
}) {


  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isHeavy = station.status === 'heavy';

  useEffect(() => {
    if (isHeavy) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isHeavy, pulseAnim]);

  return (
    <Marker
      coordinate={{ latitude: station.lat, longitude: station.lng }}
      onPress={(e) => {
        e.stopPropagation();
        onPress();
      }}
    >
      <View style={styles.markerContainer}>
        {isNearby && (
          <View style={{
            position: 'absolute',
            width: 52,
            height: 64,
            borderRadius: 26,
            borderWidth: 2.5,
            borderColor: 'white',
            opacity: 0.6,
            top: -6,
            left: -6,
          }} />
        )}
        {isHeavy && (

          <Animated.View
            style={[
              styles.markerPulse,
              {
                backgroundColor: STATUS_COLOR[station.status],
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.3],
                  outputRange: [0.6, 0],
                }),
              },
            ]}
          />
        )}
        {(() => {
          const xml = MARKER_XML[station.status];
          return xml ? <SvgXml xml={xml} width={40} height={52} /> : null;
        })()}
      </View>
    </Marker>
  );
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(12);
  const [nearbyStationId, setNearbyStationId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const isFirstLoad = useRef(true);

  useEffect(() => {
    const unsubscribe = subscribeToStations((data) => {
      setStations(data);
      if (isFirstLoad.current) {
        console.log(`Firebase connected! Loaded ${data.length} stations.`);
        isFirstLoad.current = false;
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useProximityCheck(stations, setNearbyStationId);


  const filteredStations = stations.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRegionChange = (region: Region) => {
    const zoom = Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2);
    setZoomLevel(zoom);
  };

  const getStatusBgColor = (status: StationStatus) => {
    if (status === 'heavy') return 'rgba(239, 68, 68, 0.15)';
    if (status === 'moderate') return 'rgba(249, 115, 22, 0.15)';
    return 'rgba(34, 197, 94, 0.15)';
  };

  const handleBookRide = async (station: Station) => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const url = `uber://?action=setPickup&pickup[latitude]=${location.coords.latitude}&pickup[longitude]=${location.coords.longitude}&dropoff[latitude]=${station.lat}&dropoff[longitude]=${station.lng}`;
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Uber not found', 'Please install Uber to book this ride.');
      }
    } catch {
      Alert.alert('Location required', 'Could not get your current location.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        customMapStyle={customMapStyle}
        initialRegion={{
          latitude: 6.5244,
          longitude: 3.3792,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsTraffic={true}
        showsMyLocationButton={false}
        onPress={() => setSelectedStation(null)}
        onRegionChange={onRegionChange}
      >
        {zoomLevel < 11 ? (
          // Basic clustering - just a placeholder if we wanted to group, 
          // but let's show one cluster for simplicity as requested
          <Marker
            coordinate={{ latitude: 6.5244, longitude: 3.3792 }}
            onPress={() => Alert.alert('Zoom in', 'Zoom in to see individual stations')}
          >
            <View style={styles.clusterMarker}>
              <Text style={styles.clusterText}>{filteredStations.length}</Text>
            </View>
          </Marker>
        ) : (
          filteredStations.map((station) => (
            <AnimatedMarker 
              key={station.id} 
              station={station} 
              onPress={() => setSelectedStation(station)} 
              isNearby={station.id === nearbyStationId}
            />
          ))

        )}
      </MapView>

      {/* Floating Search Bar */}
      <View style={[styles.floatingSearchContainer, { top: insets.top + 16 }]}>
        <View style={styles.floatingSearchInputContainer}>
          <Ionicons name="search-outline" size={18} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.floatingSearchInput}
            placeholder="Search stations..."
            placeholderTextColor="#475569"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{filteredStations.length} stations</Text>
        </View>
      </View>

      <StationBottomSheet
        station={selectedStation}
        onClose={() => setSelectedStation(null)}
        onReport={(station) => {
          Alert.alert('Success', `Reported as ${STATUS_LABEL[station.status]}`);
          setSelectedStation(null);
        }}
        onBookRide={(station) => {
          handleBookRide(station);
          setSelectedStation(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030816',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 40,
    height: 52,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  markerPulse: {
    position: 'absolute',
    top: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  markerOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  markerInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  floatingSearchContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
    alignItems: 'center',
  },
  floatingSearchInputContainer: {
    backgroundColor: 'rgba(10, 22, 40, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    width: '100%',
  },
  floatingSearchInput: {
    flex: 1,
    color: '#F1F5F9',
    fontSize: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  countBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  countBadgeText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
  },
  clusterMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
