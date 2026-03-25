import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, ScrollView
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Station } from '@/types/station'
import { Reminder } from '@/types/reminder'
import { reminderService } from '@/services/reminder.service'

interface Props {
  visible: boolean
  station: Station | null
  onClose: () => void
  onSaved: () => void
}

export const SetReminderModal = ({ 
  visible, station, onClose, onSaved 
}: Props) => {
  const [selectedHour, setSelectedHour] = useState(7)
  const [selectedMinute, setSelectedMinute] = useState(0)
  const [saving, setSaving] = useState(false)

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = [0, 15, 30, 45]

  const handleSave = async () => {
    if (!station) return
    setSaving(true)
    try {
      const reminder: Reminder = {
        id: `${station.id}_reminder`,
        stationId: station.id,
        stationName: station.name,
        stationLat: station.lat,
        stationLng: station.lng,
        hour: selectedHour,
        minute: selectedMinute,
        enabled: true,
        createdAt: new Date().toISOString(),
      }
      await reminderService.save(reminder)
      onSaved()
      onClose()
    } catch (err) {
      console.error('Failed to save reminder:', err)
    } finally {
      setSaving(false)
    }
  }

  const formatHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM'
    const display = h % 12 || 12
    return `${display} ${period}`
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
              <Text style={styles.title}>Set Commute Reminder</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {station?.name}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>What time do you usually leave?</Text>

          {/* Hour picker */}
          <Text style={styles.pickerLabel}>Hour</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.pickerRow}
          >
            {hours.map(h => (
              <TouchableOpacity
                key={h}
                style={[
                  styles.pill,
                  selectedHour === h && styles.pillActive
                ]}
                onPress={() => setSelectedHour(h)}
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

          {/* Minute picker */}
          <Text style={styles.pickerLabel}>Minute</Text>
          <View style={styles.minuteRow}>
            {minutes.map(m => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.pill,
                  styles.minutePill,
                  selectedMinute === m && styles.pillActive
                ]}
                onPress={() => setSelectedMinute(m)}
              >
                <Text style={[
                  styles.pillText,
                  selectedMinute === m && styles.pillTextActive
                ]}>
                  :{m.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Preview */}
          <View style={styles.preview}>
            <Ionicons name="notifications-outline" size={16} color="#3B82F6" />
            <Text style={styles.previewText}>
              You'll get a status update for {station?.name} every day at{' '}
              <Text style={styles.previewTime}>
                {reminderService.formatTime(selectedHour, selectedMinute)}
              </Text>
            </Text>
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Ionicons name="alarm-outline" size={18} color="white" />
            <Text style={styles.saveBtnText}>
              {saving ? 'Setting reminder...' : 'Set Daily Reminder'}
            </Text>
          </TouchableOpacity>

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
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
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
    marginBottom: 20,
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
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  pickerRow: {
    marginBottom: 20,
  },
  minuteRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    backgroundColor: 'rgba(59,130,246,0.05)',
    marginRight: 8,
  },
  minutePill: {
    flex: 1,
    alignItems: 'center',
    marginRight: 0,
  },
  pillActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  pillText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
  },
  previewText: {
    flex: 1,
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 20,
  },
  previewTime: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    height: 52,
    marginBottom: 8,
  },
  saveBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
})
