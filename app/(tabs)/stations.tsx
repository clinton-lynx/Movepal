import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subscribeToStations, reportStatus } from '@/services/stations.service';
import { Station, StationStatus } from '@/types/station';
import { STATUS_COLOR, STATUS_LABEL } from '@/constants/stations';
import StatusBadge from '@/components/StatusBadge';

function AnimatedStationCard({ item, index }: { item: Station; index: number }) {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay: index * 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, fadeAnim, index]);

  const getStatusBgColor = (status: StationStatus): string => {
    switch (status) {
      case 'heavy':
        return 'rgba(239, 68, 68, 0.15)';
      case 'moderate':
        return 'rgba(249, 115, 22, 0.15)';
      case 'flowing':
        return 'rgba(34, 197, 94, 0.15)';
    }
  };

  const statusColor = STATUS_COLOR[item.status];

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: statusColor }]} />
      <View style={styles.cardContent}>
        <View style={styles.row1}>
          <Text style={styles.stationName}>{item.name}</Text>
          <StatusBadge status={item.status} />
        </View>
        <View style={styles.row2}>
          <Text style={styles.metaText}>
            <Ionicons name="list-outline" size={13} color="#94A3B8" /> {item.reportCount} · <Ionicons name="time-outline" size={13} color="#94A3B8" /> {item.lastUpdated}
          </Text>
        </View>
        <View style={styles.row3}>
          <TouchableOpacity
            style={styles.outlineButton}
            activeOpacity={0.7}
            onPress={async () => {
              await reportStatus(item.id, item.status);
              Alert.alert('Success', 'Thanks! Station status updated.');
            }}
          >
            <Text style={styles.outlineButtonText}>Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fillButton}
            activeOpacity={0.85}
            onPress={() => Alert.alert('Book Ride', `Booking ride to ${item.name}`)}
          >
            <Text style={styles.fillButtonText}>Book Ride</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

export default function StationsScreen() {
  const insets = useSafeAreaInsets();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToStations((data) => {
      setStations(data);
      if (loading) setLoading(false);
    });
    return unsubscribe;
  }, [loading]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <Text style={styles.headerTitle}>Stations</Text>
        <Text style={styles.headerSubtitle}>{stations.length} stations in Lagos</Text>
      </View>

      {/* Station List or Skeletons */}
      {loading ? (
        <View style={{ padding: 16 }}>
          {[1, 2, 3].map((key) => (
            <View
              key={key}
              style={[
                styles.card,
                { height: 140, backgroundColor: '#070F1c', borderColor: '#0A1628' },
              ]}
            >
              <View style={[styles.accentBar, { backgroundColor: '#1E293B' }]} />
              <View style={[styles.cardContent, { justifyContent: 'center' }]}>
                <ActivityIndicator color="#1E293B" />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={stations}
          renderItem={({ item, index }) => <AnimatedStationCard item={item} index={index} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 120, // space for tab bar
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030816',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0F2040',
    backgroundColor: '#0A1628',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    color: '#94A3B8',
  },
  card: {
    backgroundColor: '#0A1628',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
    marginBottom: 12,
    flexDirection: 'row',
  },
  accentBar: {
    width: 3,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  row1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  row2: {
    marginBottom: 16,
  },
  metaText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  row3: {
    flexDirection: 'row',
    gap: 8,
  },
  outlineButton: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '600',
  },
  fillButton: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fillButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
