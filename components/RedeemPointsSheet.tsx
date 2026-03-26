import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, TextInput, ScrollView,
  ActivityIndicator, Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '@/lib/api'

interface RewardOption {
  points: number
  naira: number
  label: string
  description: string
}

interface Props {
  visible: boolean
  currentPoints: number
  onClose: () => void
  onRedeemed: (pointsUsed: number) => void
}

const NETWORKS = ['MTN', 'AIRTEL', 'GLO', '9MOBILE']

export const RedeemPointsSheet = ({
  visible, currentPoints, onClose, onRedeemed
}: Props) => {
  const [options, setOptions] = useState<RewardOption[]>([])
  const [selectedOption, setSelectedOption] = 
    useState<RewardOption | null>(null)
  const [selectedNetwork, setSelectedNetwork] = 
    useState<string>('MTN')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (visible) {
      api.get('/rewards/options')
        .then(res => {
          setOptions(res.data.data.options)
          setFetching(false)
        })
        .catch(() => setFetching(false))
    }
  }, [visible])

  const handleRedeem = async () => {
    if (!selectedOption) {
      return Alert.alert('Select an option', 
        'Choose how many points to redeem')
    }
    if (!phoneNumber || phoneNumber.length < 11) {
      return Alert.alert('Enter phone number', 
        'Enter a valid 11-digit Nigerian phone number')
    }
    if (currentPoints < selectedOption.points) {
      return Alert.alert('Insufficient points',
        `You need ${selectedOption.points} points but only have ${currentPoints}`)
    }

    setLoading(true)
    try {
      const response = await api.post('/rewards/redeem', {
        phoneNumber,
        pointsToRedeem: selectedOption.points,
        network: selectedNetwork,
      })

      Alert.alert(
        '🎉 Airtime Sent!',
        response.data.message,
        [{ text: 'Great!', onPress: () => {
          onRedeemed(selectedOption.points)
          onClose()
        }}]
      )
    } catch (err: any) {
      const msg = err.response?.data?.message || 
        'Redemption failed. Try again.'
      Alert.alert('Failed', msg)
    } finally {
      setLoading(false)
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
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Redeem Points</Text>
              <Text style={styles.subtitle}>
                You have {currentPoints} points
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {fetching ? (
            <ActivityIndicator 
              color="#3B82F6" 
              style={{ marginVertical: 40 }} 
            />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>

              <Text style={styles.sectionLabel}>
                Choose reward
              </Text>
              {options.map(opt => (
                <TouchableOpacity
                  key={opt.points}
                  style={[
                    styles.option,
                    selectedOption?.points === opt.points && 
                      styles.optionActive,
                    currentPoints < opt.points && 
                      styles.optionDisabled,
                  ]}
                  onPress={() => currentPoints >= opt.points && 
                    setSelectedOption(opt)}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.optionLabel,
                      selectedOption?.points === opt.points && 
                        { color: '#3B82F6' }
                    ]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.optionDesc}>
                      {opt.points} points · {opt.description}
                    </Text>
                  </View>
                  {selectedOption?.points === opt.points && (
                    <Ionicons 
                      name="checkmark-circle" 
                      size={20} 
                      color="#3B82F6" 
                    />
                  )}
                  {currentPoints < opt.points && (
                    <Text style={{ 
                      fontSize: 10, color: '#EF4444' 
                    }}>
                      Need {opt.points - currentPoints} more
                    </Text>
                  )}
                </TouchableOpacity>
              ))}

              <Text style={styles.sectionLabel}>
                Select network
              </Text>
              <View style={styles.networkRow}>
                {NETWORKS.map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[
                      styles.networkPill,
                      selectedNetwork === n && 
                        styles.networkPillActive
                    ]}
                    onPress={() => setSelectedNetwork(n)}
                  >
                    <Text style={[
                      styles.networkText,
                      selectedNetwork === n && 
                        { color: 'white', fontWeight: '700' }
                    ]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>
                Phone number
              </Text>
              <TextInput
                style={styles.input}
                placeholder="08012345678"
                placeholderTextColor="#475569"
                keyboardType="phone-pad"
                maxLength={11}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />

              <View style={styles.poweredBy}>
                <Ionicons 
                  name="shield-checkmark-outline" 
                  size={14} 
                  color="#64748B" 
                />
                <Text style={styles.poweredByText}>
                  Powered by Interswitch
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.redeemBtn,
                  (!selectedOption || loading) && 
                    { opacity: 0.6 }
                ]}
                onPress={handleRedeem}
                disabled={!selectedOption || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator 
                    size="small" 
                    color="white" 
                  />
                ) : (
                  <Ionicons 
                    name="gift-outline" 
                    size={18} 
                    color="white" 
                  />
                )}
                <Text style={styles.redeemBtnText}>
                  {loading 
                    ? 'Processing...' 
                    : selectedOption 
                      ? `Redeem ${selectedOption.points} points for ${selectedOption.label}`
                      : 'Select a reward'
                  }
                </Text>
              </TouchableOpacity>
            </ScrollView>
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
    maxHeight: '85%',
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
  subtitle: { fontSize: 13, color: '#64748B' },
  sectionLabel: {
    fontSize: 11, color: '#475569', fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 10, marginTop: 4,
  },
  option: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
    backgroundColor: 'rgba(59,130,246,0.05)',
    marginBottom: 8,
  },
  optionActive: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  optionDisabled: { opacity: 0.5 },
  optionLabel: {
    fontSize: 15, fontWeight: '600', color: '#F1F5F9', marginBottom: 2,
  },
  optionDesc: { fontSize: 11, color: '#64748B' },
  networkRow: {
    flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap',
  },
  networkPill: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    backgroundColor: 'rgba(59,130,246,0.05)',
  },
  networkPillActive: {
    backgroundColor: '#3B82F6', borderColor: '#3B82F6',
  },
  networkText: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  input: {
    backgroundColor: '#0F2040', borderRadius: 10,
    padding: 14, color: '#F1F5F9', fontSize: 15,
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)',
    marginBottom: 12,
  },
  poweredBy: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, marginBottom: 16,
    justifyContent: 'center',
  },
  poweredByText: { fontSize: 11, color: '#64748B' },
  redeemBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    backgroundColor: '#3B82F6', borderRadius: 12,
    height: 52, marginBottom: 8,
  },
  redeemBtnText: {
    color: 'white', fontSize: 14, fontWeight: '700',
  },
})
