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
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subscribeToStations } from '@/services/stations.service';
import { Station, StationStatus } from '@/types/station';
import { STATUS_COLOR, STATUS_LABEL } from '@/constants/stations';
import StatusBadge from '@/components/StatusBadge';
import * as Location from 'expo-location';

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

function AnimatedMarker({ station, onPress }: { station: Station; onPress: () => void }) {
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
        <View style={styles.markerOuter}>
          <View style={[styles.markerInner, { backgroundColor: STATUS_COLOR[station.status] }]} />
        </View>
      </View>
    </Marker>
  );
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  const slideAnim = useRef(new Animated.Value(height)).current;

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

  const openSheet = (station: Station) => {
    setSelectedStation(station);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 65,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const closeSheet = () => {
    Animated.spring(slideAnim, {
      toValue: height,
      tension: 65,
      friction: 10,
      useNativeDriver: true,
    }).start(() => setSelectedStation(null));
  };

  const getStatusBgColor = (status: StationStatus) => {
    if (status === 'heavy') return 'rgba(239, 68, 68, 0.15)';
    if (status === 'moderate') return 'rgba(249, 115, 22, 0.15)';
    return 'rgba(34, 197, 94, 0.15)';
  };

  const handleBookRide = async () => {
    if (!selectedStation) return;
    try {
      const location = await Location.getCurrentPositionAsync({});
      const url = `uber://?action=setPickup&pickup[latitude]=${location.coords.latitude}&pickup[longitude]=${location.coords.longitude}&dropoff[latitude]=${selectedStation.lat}&dropoff[longitude]=${selectedStation.lng}`;
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
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={closeSheet}
      >
        {stations.map((station) => (
          <AnimatedMarker key={station.id} station={station} onPress={() => openSheet(station)} />
        ))}
      </MapView>

      <Animated.View
        style={[
          styles.sheetContainer,
          { transform: [{ translateY: slideAnim }] },
          { paddingBottom: insets.bottom + 90 }, // space for floating tab bar
        ]}
      >
        <BlurView intensity={40} tint="dark" style={styles.sheetContent}>
          <View style={styles.dragHandle} />
          {selectedStation && (
            <View style={styles.sheetInner}>
              <View style={styles.sheetHeaderRow}>
                <Text style={styles.stationName}>{selectedStation.name}</Text>
                <StatusBadge status={selectedStation.status} />
              </View>

              <Text style={styles.reportCountText}>
                <Ionicons name="list-outline" size={13} color="#94A3B8" /> {selectedStation.reportCount} reports · <Ionicons name="time-outline" size={13} color="#94A3B8" /> {selectedStation.lastUpdated}
              </Text>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.bookButton}
                activeOpacity={0.85}
                onPress={handleBookRide}
              >
                <Text style={styles.bookButtonText}>Book a Ride</Text>
              </TouchableOpacity>

              <View style={styles.reportRow}>
                {(['heavy', 'moderate', 'flowing'] as StationStatus[]).map((status) => {
                  const statusColors = { heavy: '#EF4444', moderate: '#F97316', flowing: '#22C55E' };
                  return (
                  <TouchableOpacity
                    key={status}
                    style={styles.reportPill}
                    activeOpacity={0.7}
                    onPress={() => {
                      Alert.alert('Success', `Reported as ${STATUS_LABEL[status]}`);
                      closeSheet();
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ backgroundColor: statusColors[status], width: 10, height: 10, borderRadius: 5 }} />
                      <Text style={styles.reportPillText}>{STATUS_LABEL[status]}</Text>
                    </View>
                  </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </BlurView>
      </Animated.View>
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
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPulse: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
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
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 24,
    overflow: 'visible',
  },
  sheetContent: {
    backgroundColor: 'rgba(10, 22, 40, 0.85)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetInner: {
    paddingBottom: 20,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stationName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  reportCountText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: '100%',
    marginVertical: 16,
  },
  bookButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  reportRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reportPill: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportPillText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '600',
  },
});
