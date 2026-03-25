import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, Linking, Platform, Alert, ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { Station } from '@/types/station'

interface Props {
  visible: boolean
  station: Station | null
  onClose: () => void
}

const RIDE_OPTIONS = [
  {
    id: 'bolt',
    name: 'Bolt',
    color: '#34D186',
    bgColor: 'rgba(52,209,134,0.1)',
    borderColor: 'rgba(52,209,134,0.25)',
    icon: 'flash-outline',
    description: 'Fast and affordable',
  },
  {
    id: 'uber',
    name: 'Uber',
    color: '#FFFFFF',
    bgColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.15)',
    icon: 'car-outline',
    description: 'Reliable rides anytime',
  },
  {
    id: 'indrive',
    name: 'InDrive',
    color: '#FACC15',
    bgColor: 'rgba(250,204,21,0.1)',
    borderColor: 'rgba(250,204,21,0.25)',
    icon: 'navigate-outline',
    description: 'Negotiate your own fare',
  },
]

export const RideOptions = ({ visible, station, onClose }: Props) => {
  const [loading, setLoading] = useState<string | null>(null)

  const openRide = async (appId: string) => {
    if (!station) return
    setLoading(appId)

    try {
      const { status } = await Location.getForegroundPermissionsAsync()
      
      let uLat = station.lat + 0.002
      let uLng = station.lng + 0.002

      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        uLat = loc.coords.latitude
        uLng = loc.coords.longitude
      }

      const dLat = station.lat.toFixed(6)
      const dLng = station.lng.toFixed(6)
      const pLat = uLat.toFixed(6)
      const pLng = uLng.toFixed(6)

      let url = ''

      if (appId === 'bolt') {
        url = `https://bolt.eu/ride/?pickup_lat=${pLat}&pickup_lng=${pLng}&dropoff_lat=${dLat}&dropoff_lng=${dLng}`
      } else if (appId === 'uber') {
        url = `https://m.uber.com/ul/?action=setPickup&pickup%5Blatitude%5D=${pLat}&pickup%5Blongitude%5D=${pLng}&dropoff%5Blatitude%5D=${dLat}&dropoff%5Blongitude%5D=${dLng}`
      } else if (appId === 'indrive') {
        url = Platform.OS === 'android'
          ? 'https://play.google.com/store/apps/details?id=sinet.startup.inDriver'
          : 'https://apps.apple.com/app/indrive/id1436428093'
      }

      console.log('Opening URL:', url)
      const supported = await Linking.canOpenURL(url)
      if (supported || url.startsWith('https://')) {
        await Linking.openURL(url)
      } else {
        Alert.alert('Error', 'Could not open this app')
      }
      onClose()
    } catch (err) {
      console.error('Ride link error:', err)
      Alert.alert(
        'Could not open',
        'Try installing the app first or check your connection.'
      )
    } finally {
      setLoading(null)
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={styles.sheet}>

          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Book a Ride</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                To {station?.name}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>
            Choose your ride — pre-filled with your 
            location and this station as destination
          </Text>

          {/* Ride options */}
          {RIDE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                {
                  backgroundColor: option.bgColor,
                  borderColor: option.borderColor,
                },
                loading === option.id && { opacity: 0.7 }
              ]}
              onPress={() => openRide(option.id)}
              disabled={loading !== null}
              activeOpacity={0.8}
            >
              <View style={[
                styles.iconCircle,
                { backgroundColor: option.bgColor }
              ]}>
                {loading === option.id ? (
                  <ActivityIndicator 
                    size="small" 
                    color={option.color} 
                  />
                ) : (
                  <Ionicons
                    name={option.icon as any}
                    size={22}
                    color={option.color}
                  />
                )}
              </View>
              <View style={styles.optionText}>
                <Text style={[
                  styles.optionName,
                  { color: option.color }
                ]}>
                  {loading === option.id 
                    ? 'Opening...' 
                    : option.name
                  }
                </Text>
                <Text style={styles.optionDesc}>
                  {option.description}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={option.color}
              />
            </TouchableOpacity>
          ))}

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>
            Your current location will be used as pickup. 
            Station location will be set as destination.
          </Text>

        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#0A1628',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(59,130,246,0.2)',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    maxWidth: 260,
  },
  label: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
    lineHeight: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  disclaimer: {
    fontSize: 11,
    color: '#334155',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
})
