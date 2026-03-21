import React, { useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import { Station } from '@/types/station';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, fontSize } from '@/constants/theme';

interface RideOptionsProps {
  station: Station | null;
  isVisible: boolean;
  onClose: () => void;
}

const RIDE_SERVICES = [
  {
    name: 'Uber',
    icon: 'car-outline',
    color: '#F1F5F9', // changed to light for dark theme visibility
  },
  {
    name: 'Bolt',
    icon: 'flash-outline',
    color: '#34D186',
  },
  {
    name: 'InDrive',
    icon: 'car-sport-outline',
    color: '#C6FF00',
  },
] as const;

export default function RideOptions({
  station,
  isVisible,
  onClose,
}: RideOptionsProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['35%'], []);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose],
  );

  const openRideApp = useCallback(
    async (service: (typeof RIDE_SERVICES)[number]) => {
      if (!station) return;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Location Required',
            'Please enable location to book a ride.',
          );
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const pickupLat = location.coords.latitude;
        const pickupLng = location.coords.longitude;
        const dropoffLat = station.lat;
        const dropoffLng = station.lng;

        let url = '';

        switch (service.name) {
          case 'Uber':
            url = `uber://?action=setPickup&pickup[latitude]=${pickupLat}&pickup[longitude]=${pickupLng}&dropoff[latitude]=${dropoffLat}&dropoff[longitude]=${dropoffLng}`;
            break;
          case 'Bolt':
            url = `https://bolt.eu/ride/?pickup_lat=${pickupLat}&pickup_lng=${pickupLng}&dropoff_lat=${dropoffLat}&dropoff_lng=${dropoffLng}`;
            break;
          case 'InDrive':
            url = 'indrive://';
            break;
        }

        const canOpen = await Linking.canOpenURL(url);

        if (canOpen) {
          await Linking.openURL(url);
        } else {
          // Fallback for InDrive
          if (service.name === 'InDrive') {
            const storeUrl =
              Platform.OS === 'ios'
                ? 'https://apps.apple.com/app/indrive/id1436428093'
                : 'market://details?id=sinet.startup.inDriver';
            await Linking.openURL(storeUrl);
          } else {
            Alert.alert(
              'App Not Found',
              `${service.name} is not installed on your device.`,
            );
          }
        }
      } catch (error) {
        Alert.alert('Error', 'Unable to open ride app. Please try again.');
      }
    },
    [station],
  );

  if (!isVisible || !station) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backgroundStyle={[styles.background, { backgroundColor: '#0A1628' }]}
      handleIndicatorStyle={[
        styles.handleIndicator,
        { backgroundColor: '#94A3B8' },
      ]}
    >
      <BottomSheetView style={styles.content}>
        <Text style={[styles.title, { color: '#F1F5F9' }]}>
          Book a Ride to {station.name}
        </Text>
        <Text style={[styles.subtitle, { color: '#94A3B8' }]}>
          Choose your preferred ride service
        </Text>

        <View style={styles.buttonContainer}>
          {RIDE_SERVICES.map((service) => (
            <TouchableOpacity
              key={service.name}
              style={[
                styles.rideButton,
                { backgroundColor: '#030816', borderColor: 'rgba(59, 130, 246, 0.1)' },
              ]}
              activeOpacity={0.85}
              onPress={() => openRideApp(service as any)}
            >
              <Ionicons name={service.icon as any} size={28} color={service.color} style={styles.rideIcon} />
              <Text style={[styles.rideName, { color: '#F1F5F9' }]}>
                {service.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  handleIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rideButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  rideIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  rideName: {
    fontSize: fontSize.base,
    fontWeight: '600',
  },
});
