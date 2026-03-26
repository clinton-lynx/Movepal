import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { authService } from '@/services/auth.service';
import { User } from '@/types/auth';
import { storage } from '@/lib/storage';
import { Ionicons } from '@expo/vector-icons';
import { sendLocalNotification } from '@/services/notification.service';
import { reminderService } from '@/services/reminder.service';
import { Reminder } from '@/types/reminder';
import { RedeemPointsSheet } from '@/components/RedeemPointsSheet';
import api from '@/lib/api';

export default function ProfileScreen() {

  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showRedeem, setShowRedeem] = useState(false);
  const [points, setPoints] = useState(0);

  useFocusEffect(
    useCallback(() => {
      async function loadData() {
        const [currentUser, allReminders] = await Promise.all([
          storage.getUser(),
          reminderService.getAll()
        ]);
        if (currentUser) setUser(currentUser);
        setReminders(allReminders);

        try {
          const response = await api.get('/rewards/balance');
          setPoints(response.data.data.points);
        } catch (error) {
          console.error('Failed to fetch points:', error);
        }
      }
      loadData();
    }, [])
  );


  const toggleReminder = async (reminder: Reminder) => {
    const updated = { ...reminder, enabled: !reminder.enabled };
    await reminderService.save(updated);
    const all = await reminderService.getAll();
    setReminders(all);
  };

  const deleteReminder = async (id: string) => {
    await reminderService.remove(id);
    const all = await reminderService.getAll();
    setReminders(all);
  };


  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 120 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          <Ionicons name="person-outline" size={24} color="#F1F5F9" /> Profile
        </Text>
      </View>

      <View style={{
        backgroundColor: 'rgba(59,130,246,0.1)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.2)',
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <View>
          <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            MovePal Points
          </Text>
          <Text style={{ fontSize: 32, fontWeight: '800', color: '#3B82F6', marginTop: 4 }}>
            {points}
          </Text>
          <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
            Earn 10 points per report
          </Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: '#3B82F6',
            borderRadius: 10,
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
          onPress={() => setShowRedeem(true)}
        >
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>
            Redeem
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <Image
          source={{ uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${user?.email || 'Guest'}` }}
          style={styles.avatar}
        />

        <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
      </View>

      <Text style={styles.sectionLabel}>Commute Reminders</Text>
      
      {reminders.length === 0 ? (
        <View style={styles.infoCard}>
          <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center' }}>
            No reminders set yet.
          </Text>
        </View>
      ) : (
        reminders.map(r => (
          <View key={r.id} style={styles.reminderCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.reminderStation}>{r.stationName}</Text>
              <Text style={styles.reminderTime}>
                Daily at {reminderService.formatTime(r.hour, r.minute)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Switch
                value={r.enabled}
                onValueChange={() => toggleReminder(r)}
                trackColor={{ false: '#1E293B', true: '#3B82F6' }}
                thumbColor="#F1F5F9"
              />
              <TouchableOpacity onPress={() => deleteReminder(r.id)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <Text style={styles.sectionLabel}>Account Info</Text>


      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={20} color="#3B82F6" />
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
          <Text style={styles.infoLabel}>Joined</Text>
          <Text style={styles.infoValue}>March 2026</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="settings-outline" size={20} color="#3B82F6" />
          <Text style={styles.infoLabel}>Settings</Text>
          <Ionicons name="chevron-forward-outline" size={20} color="#94A3B8" />
        </View>
      </View>

      <TouchableOpacity
        onPress={() =>
          sendLocalNotification('🚨 Station Alert — MovePal', 'Oshodi Terminal is now heavily congested!')
        }
        style={styles.testButton}
        activeOpacity={0.7}
      >
        <Ionicons name="notifications-outline" size={20} color="#3B82F6" />
        <Text style={styles.testButtonText}>Test Notification</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>MovePal v1.0.0</Text>

      <RedeemPointsSheet
        visible={showRedeem}
        currentPoints={points}
        onClose={() => setShowRedeem(false)}
        onRedeemed={(used) => setPoints(prev => prev - used)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030816',
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  profileCard: {
    backgroundColor: '#0A1628',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  userName: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    color: '#94A3B8',
    fontSize: 14,
  },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#0A1628',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    flex: 1,
    color: '#F1F5F9',
    fontSize: 15,
  },
  infoValue: {
    color: '#64748B',
    fontSize: 14,
  },
  reminderCard: {
    backgroundColor: '#0A1628',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderStation: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  reminderTime: {
    color: '#64748B',
    fontSize: 13,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  testButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  versionText: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 32,
  },
});
