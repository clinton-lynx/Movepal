import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, ActivityIndicator, ScrollView
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Station } from '@/types/station'

const ML_URL = 'https://movepal-ml.onrender.com'

interface PredictionResult {
  status: 'heavy' | 'moderate' | 'flowing'
  confidence: number
}

interface Props {
  visible: boolean
  station: Station | null
  onClose: () => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAYS = [
  { label: 'Today', value: new Date().getDay() === 0 ? 6 : new Date().getDay() - 1 },
  { label: 'Tomorrow', value: new Date().getDay() === 6 ? 0 : (new Date().getDay() === 0 ? 1 : new Date().getDay()) },
  { label: 'Monday', value: 0 },
  { label: 'Tuesday', value: 1 },
  { label: 'Wednesday', value: 2 },
  { label: 'Thursday', value: 3 },
  { label: 'Friday', value: 4 },
  { label: 'Saturday', value: 5 },
  { label: 'Sunday', value: 6 },
]

const STATUS_CONFIG = {
  heavy: {
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.25)',
    icon: 'warning-outline',
    message: 'Expect heavy congestion. Plan ahead or book a ride.',
  },
  moderate: {
    color: '#F97316',
    bg: 'rgba(249,115,22,0.1)',
    border: 'rgba(249,115,22,0.25)',
    icon: 'time-outline',
    message: 'Moderate congestion expected. Allow extra time.',
  },
  flowing: {
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.25)',
    icon: 'checkmark-circle-outline',
    message: 'Should be flowing well. Good time to travel.',
  },
}

const formatHour = (h: number): string => {
  const period = h >= 12 ? 'PM' : 'AM'
  const display = h % 12 || 12
  return `${display}:00 ${period}`
}

export const PredictTimeSheet = ({ visible, station, onClose }: Props) => {
  const [selectedHour, setSelectedHour] = useState(7)
  const [selectedDay, setSelectedDay] = useState(DAYS[0])
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handlePredict = async () => {
    if (!station) return
    setLoading(true)
    setPrediction(null)

    try {
      const response = await fetch(`${ML_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: station.lat,
          lng: station.lng,
          hour: selectedHour,
          day_of_week: selectedDay.value,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setPrediction(data.data)
      }
    } catch (err) {
      console.error('Prediction failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const config = prediction ? STATUS_CONFIG[prediction.status] : null

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

          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Predict Congestion</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {station?.name}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Select day</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 20 }}
          >
            {DAYS.map((day) => (
              <TouchableOpacity
                key={day.label}
                style={[
                  styles.pill,
                  selectedDay.label === day.label && styles.pillActive
                ]}
                onPress={() => {
                  setSelectedDay(day)
                  setPrediction(null)
                }}
              >
                <Text style={[
                  styles.pillText,
                  selectedDay.label === day.label && styles.pillTextActive
                ]}>
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Select time</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 20 }}
          >
            {HOURS.map((h) => (
              <TouchableOpacity
                key={h}
                style={[
                  styles.pill,
                  selectedHour === h && styles.pillActive
                ]}
                onPress={() => {
                  setSelectedHour(h)
                  setPrediction(null)
                }}
              >
                <Text style={[
                  styles.pillText,
                  selectedHour === h && styles.pillTextActive
                ]}>
                  {formatHour(h)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Predict button */}
          <TouchableOpacity
            style={[styles.predictBtn, loading && { opacity: 0.7 }]}
            onPress={handlePredict}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="analytics-outline" size={18} color="white" />
            )}
            <Text style={styles.predictBtnText}>
              {loading
                ? 'Analysing...'
                : `Predict ${selectedDay.label} at ${formatHour(selectedHour)}`
              }
            </Text>
          </TouchableOpacity>

          {/* Result */}
          {prediction && config && (
            <View style={[
              styles.result,
              {
                backgroundColor: config.bg,
                borderColor: config.border,
              }
            ]}>
              <View style={styles.resultHeader}>
                <Ionicons
                  name={config.icon as any}
                  size={24}
                  color={config.color}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resultStatus, { color: config.color }]}>
                    {prediction.status.toUpperCase()}
                  </Text>
                  <Text style={styles.resultConfidence}>
                    {prediction.confidence}% confidence
                  </Text>
                </View>
              </View>
              <Text style={styles.resultMessage}>
                {config.message}
              </Text>
              <Text style={styles.resultTime}>
                {station?.name} · {selectedDay.label} at {formatHour(selectedHour)}
              </Text>
            </View>
          )}

        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
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
    width: 40, height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 18, fontWeight: '700', color: '#F1F5F9', marginBottom: 4,
  },
  subtitle: { fontSize: 13, color: '#64748B', maxWidth: 260 },
  label: {
    fontSize: 12, color: '#475569', fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  pill: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    backgroundColor: 'rgba(59,130,246,0.05)',
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  pillText: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  pillTextActive: { color: '#FFFFFF', fontWeight: '700' },
  predictBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    backgroundColor: '#3B82F6', borderRadius: 12,
    height: 52, marginBottom: 16,
  },
  predictBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
  result: {
    borderRadius: 14, borderWidth: 1,
    padding: 16, gap: 8,
  },
  resultHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  resultStatus: { fontSize: 20, fontWeight: '800' },
  resultConfidence: { fontSize: 12, color: '#64748B', marginTop: 2 },
  resultMessage: { fontSize: 13, color: '#94A3B8', lineHeight: 20 },
  resultTime: { fontSize: 11, color: '#475569', marginTop: 4 },
})
