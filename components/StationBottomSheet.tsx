import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, Animated,
  Dimensions, StyleSheet, Image, ActivityIndicator
} from 'react-native'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { predictStation, Prediction } from '@/services/prediction.service'
import { Station } from '@/types/station'
import { ReportStatusSheet } from './ReportStatusSheet'
import { RideOptions } from './RideOptions'
import { PredictTimeSheet } from './PredictTimeSheet'




import StatusBadge from './StatusBadge'

/** Formats an ISO date string (or any parseable date) to e.g. "4:00pm" */
function formatTime(raw: string | undefined): string {
  if (!raw) return ''
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw // already human-readable, return as-is
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).toLowerCase().replace(' ', '') // "4:00 pm" → "4:00pm"
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const SHEET_HEIGHT = 280

interface Props {
  station: Station | null
  onClose: () => void
  onReport: (station: Station) => void
  onBookRide: (station: Station) => void
}

export const StationBottomSheet = ({ 
  station: propStation, onClose, onReport, onBookRide 
}: Props) => {
  const insets = useSafeAreaInsets()
  // Tab bar is ~49px; add safe area bottom + a little padding
  const TAB_BAR_HEIGHT = 49
  const BOTTOM_OFFSET = insets.bottom + TAB_BAR_HEIGHT + 32
  const HIDDEN_Y = SHEET_HEIGHT + BOTTOM_OFFSET + 20
  
  const translateY = useRef(new Animated.Value(HIDDEN_Y)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const [visible, setVisible] = useState(false)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [predicting, setPredicting] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showRide, setShowRide] = useState(false)
  const [showPredict, setShowPredict] = useState(false)



  
  // Keep the station around to render contents smoothly as it animates out
  const [activeStation, setActiveStation] = useState<Station | null>(null)

  const station = propStation || activeStation

  useEffect(() => {
    if (!station) {
      setPrediction(null)
      return
    }
    setPredicting(true)
    predictStation(station.lat, station.lng)
      .then(result => {
        setPrediction(result)
        setPredicting(false)
      })
      .catch(() => setPredicting(false))
  }, [station])

  useEffect(() => {
    if (propStation) {
      setVisible(true)
      // Animate IN
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      // Animate OUT
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: HIDDEN_Y,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setVisible(false)
        setActiveStation(null)
      })
    }
  }, [propStation])

  if (!visible && !activeStation) {
    return null
  }

  const STATUS_COLORS = {
    heavy:    '#EF4444',
    moderate: '#F97316',
    flowing:  '#22C55E',
  }

  return (
    <View style={StyleSheet.absoluteFill} 
          pointerEvents={station ? 'auto' : 'none'}>
      
      {/* Backdrop — tap to dismiss */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { opacity: backdropOpacity }
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        >
          <View style={{ 
            flex: 1, 
            backgroundColor: 'rgba(0,0,0,0.4)' 
          }} />
        </TouchableOpacity>
      </Animated.View>

      {/* The sheet itself */}
      <Animated.View
        style={[
          styles.sheet,
          { bottom: BOTTOM_OFFSET, transform: [{ translateY }] }
        ]}
      >
        <BlurView
          intensity={80}
          tint="dark"
          style={styles.blurContainer}
        >
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Header row */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.stationName} numberOfLines={1}>
                {station?.name}
              </Text>
              {station?.address ? (
                <Text style={styles.address} numberOfLines={1}>
                  {station.address}
                </Text>
              ) : null}
            </View>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              gap: 10 
            }}>
              {station && <StatusBadge status={station.status} />}
              <TouchableOpacity onPress={onClose}>
                <Ionicons 
                  name="close" 
                  size={22} 
                  color="#94A3B8" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons 
                name="people-outline" 
                size={14} 
                color="#64748B" 
              />
              <Text style={styles.statText}>
                {station?.reportCount} reports
              </Text>
            </View>
            <View style={styles.statDot} />
            <View style={styles.stat}>
              <Ionicons 
                name="time-outline" 
                size={14} 
                color="#64748B" 
              />
              <Text style={styles.statText}>
                {formatTime(station?.lastUpdated)}
              </Text>
            </View>
            <View style={styles.statDot} />
            <View style={styles.stat}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: station 
                  ? STATUS_COLORS[station.status] 
                  : '#94A3B8'
              }} />
              <Text style={[
                styles.statText, 
                { 
                  color: station 
                    ? STATUS_COLORS[station.status] 
                    : '#94A3B8',
                  fontWeight: '700'
                }
              ]}>
                {station?.status?.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {predicting && (
            <View style={styles.predictionLoading}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={styles.predictionLoadingText}>
                Analysing congestion...
              </Text>
            </View>
          )}

          {prediction && !predicting && (
            <View style={[
              styles.predictionBanner,
              {
                backgroundColor: prediction.status === 'heavy' 
                  ? 'rgba(239,68,68,0.1)'
                  : prediction.status === 'moderate'
                  ? 'rgba(249,115,22,0.1)' 
                  : 'rgba(34,197,94,0.1)',
                borderColor: prediction.status === 'heavy'
                  ? 'rgba(239,68,68,0.25)'
                  : prediction.status === 'moderate'
                  ? 'rgba(249,115,22,0.25)'
                  : 'rgba(34,197,94,0.25)',
              }
            ]}>
              <Ionicons 
                name={
                  prediction.status === 'heavy' 
                    ? 'warning-outline'
                    : prediction.status === 'moderate'
                    ? 'time-outline'
                    : 'checkmark-circle-outline'
                }
                size={14}
                color={
                  prediction.status === 'heavy' ? '#EF4444'
                  : prediction.status === 'moderate' ? '#F97316'
                  : '#22C55E'
                }
              />
              <Text style={[
                styles.predictionText,
                {
                  color: prediction.status === 'heavy' ? '#EF4444'
                    : prediction.status === 'moderate' ? '#F97316'
                    : '#22C55E'
                }
              ]}>
                AI predicts {prediction.status} · {prediction.confidence}% confident
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => setShowReport(true)}
              activeOpacity={0.8}
            >

              <Ionicons 
                name="flag-outline" 
                size={16} 
                color="#3B82F6" 
              />
              <Text style={styles.outlineButtonText}>
                Report
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowRide(true)}
              activeOpacity={0.85}
            >

              <Ionicons 
                name="car-outline" 
                size={16} 
                color="white" 
              />
              <Text style={styles.primaryButtonText}>
                Book a Ride
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              marginTop: 12,
              paddingVertical: 8,
            }}
            onPress={() => setShowPredict(true)}
          >
            <Ionicons name="analytics-outline" size={14} color="#A78BFA" />
            <Text style={{ color: '#A78BFA', fontSize: 13, fontWeight: '600' }}>
              Predict congestion for a specific time
            </Text>
          </TouchableOpacity>


          <ReportStatusSheet
            visible={showReport}
            station={station}
            onClose={() => setShowReport(false)}
            onReported={(status) => {
              setShowReport(false)
              if (station) onReport(station)
            }}
          />

          <RideOptions 
            visible={showRide} 
            station={station} 
            onClose={() => setShowRide(false)} 
          />

          <PredictTimeSheet
            visible={showPredict}
            station={station}
            onClose={() => setShowPredict(false)}
          />
        </BlurView>
      </Animated.View>



    </View>
  )
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    // bottom is set dynamically via inline style using insets
    left: 16,
    right: 16,
    height: SHEET_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  blurContainer: {
    flex: 1,
    padding: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  stationName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  address: {
    fontSize: 12,
    color: '#64748B',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#64748B',
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#334155',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  outlineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  outlineButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  predictionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  predictionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  predictionLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  predictionLoadingText: {
    fontSize: 12,
    color: '#64748B',
  },
})

