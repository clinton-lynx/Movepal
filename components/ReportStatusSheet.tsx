import React, { useRef, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, Animated
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Station, StationStatus } from '@/types/station'
import { reportStatus } from '@/services/stations.service'

interface Props {
  visible: boolean
  station: Station | null
  onClose: () => void
  onReported: (status: StationStatus) => void
}

const STATUS_OPTIONS = [
  {
    status: 'heavy' as StationStatus,
    label: 'Heavy',
    description: 'Long queue, very crowded, avoid if possible',
    color: '#EF4444',
    bgColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.25)',
    icon: 'warning-outline',
  },
  {
    status: 'moderate' as StationStatus,
    label: 'Moderate',
    description: 'Some crowd, moving but slow',
    color: '#F97316',
    bgColor: 'rgba(249,115,22,0.1)',
    borderColor: 'rgba(249,115,22,0.25)',
    icon: 'time-outline',
  },
  {
    status: 'flowing' as StationStatus,
    label: 'Flowing',
    description: 'Clear, buses available, moving well',
    color: '#22C55E',
    bgColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.25)',
    icon: 'checkmark-circle-outline',
  },
]

export const ReportStatusSheet = ({
  visible, station, onClose, onReported
}: Props) => {
  const translateY = useRef(new Animated.Value(450)).current
  const [submitting, setSubmitting] = React.useState<StationStatus | null>(null)

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(translateY, {
        toValue: 450,
        duration: 220,
        useNativeDriver: true,
      }).start()
    }
  }, [visible])

  const handleReport = async (status: StationStatus) => {
    if (!station || submitting) return
    setSubmitting(status)
    try {
      await reportStatus(station.id, status)
      onReported(status)
      onClose()
    } catch (err) {
      console.error('Report failed:', err)
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          activeOpacity={1}
        />
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY }] }
          ]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Report Station Status</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {station?.name}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.question}>
            What is the situation at this station right now?
          </Text>

          {/* Status options */}
          {STATUS_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.status}
              style={[
                styles.option,
                {
                  backgroundColor: option.bgColor,
                  borderColor: option.borderColor,
                }
              ]}
              onPress={() => handleReport(option.status)}
              disabled={submitting !== null}
              activeOpacity={0.8}
            >
              <View style={[
                styles.iconCircle,
                { backgroundColor: option.bgColor }
              ]}>
                {submitting === option.status ? (
                  <Ionicons
                    name="sync-outline"
                    size={22}
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
                  styles.optionLabel,
                  { color: option.color }
                ]}>
                  {submitting === option.status
                    ? 'Submitting...'
                    : option.label
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

          {/* Points incentive banner */}
          <View style={styles.pointsBanner}>
            <Ionicons
              name="gift-outline"
              size={14}
              color="#60A5FA"
            />
            <Text style={styles.pointsText}>
              Earn 10 MovePal points for every accurate report
            </Text>
          </View>

        </Animated.View>
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
    paddingBottom: 36,
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
    marginBottom: 16,
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
  question: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16,
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
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  pointsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
  },
  pointsText: {
    fontSize: 12,
    color: '#60A5FA',
    fontWeight: '500',
  },
})
