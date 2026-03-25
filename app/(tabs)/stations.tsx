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
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subscribeToStations, reportStatus } from '@/services/stations.service';
import StatusBadge from '@/components/StatusBadge';
import { predictStation, Prediction } from '@/services/prediction.service';
import { Station, StationStatus } from '@/types/station';
import { STATUS_COLOR, STATUS_LABEL } from '@/constants/stations';
import { SetReminderModal } from '@/components/SetReminderModal';
import { ReportStatusSheet } from '@/components/ReportStatusSheet';
import { RideOptions } from '@/components/RideOptions';
import { PredictTimeSheet } from '@/components/PredictTimeSheet';


/** Formats an ISO date string (or any parseable date) to e.g. "4:00pm" */
function formatTime(raw: string | undefined): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw ?? ''; // already human-readable
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).toLowerCase().replace(' ', ''); // "4:00 pm" → "4:00pm"
}


function AnimatedStationCard({ item, index, predictions, onSetReminder, onReport, onBookRide, onPredict }: { 
  item: Station; 
  index: number; 
  predictions: Record<string, Prediction>;
  onSetReminder: (station: Station) => void;
  onReport: (station: Station) => void;
  onBookRide: (station: Station) => void;
  onPredict: (station: Station) => void;
}) {




  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingPred, setIsLoadingPred] = useState(false);

  const handlePress = async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }
    setIsExpanded(true);
    if (!prediction && !isLoadingPred) {
      setIsLoadingPred(true);
      const pred = await predictStation(item.lat, item.lng);
      setPrediction(pred);
      setIsLoadingPred(false);
    }
  };

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
    <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
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
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.stationName}>{item.name}</Text>
            {item.address && (
              <Text style={styles.stationAddress} numberOfLines={1} ellipsizeMode="tail">
                {item.address}
              </Text>
            )}
          </View>
          <StatusBadge status={item.status} />
        </View>
        <View style={styles.row2}>
          <Text style={styles.metaText}>
            <Ionicons name="list-outline" size={13} color="#94A3B8" /> {item.reportCount} · <Ionicons name="time-outline" size={13} color="#94A3B8" /> (Last update: {formatTime(item.lastUpdated)})
          </Text>

          
          {predictions[item.id] && (
            <View style={styles.predictionPill}>
              <Text style={styles.predictionPillText}>
                AI: {predictions[item.id].status} · {predictions[item.id].confidence}%
              </Text>
            </View>
          )}
        </View>

        {isExpanded && isLoadingPred && (
          <View style={{ marginBottom: 12, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#3B82F6" />
          </View>
        )}

        {isExpanded && prediction && prediction.status !== item.status && (
          ({
            'moderate-heavy': (
              <View style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: 'rgba(239, 68, 68, 0.2)',
                borderWidth: 1,
                borderRadius: 8,
                padding: 8,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="warning-outline" size={14} color="#EF4444" />
                  <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: 'bold' }}>
                    AI predicts Heavy congestion soon
                  </Text>
                </View>
                <Text style={{ color: '#EF4444', fontSize: 10, opacity: 0.8, fontWeight: 'bold' }}>
                  {Math.round(prediction.confidence * 100)}% confident
                </Text>
              </View>
            ),
            'heavy-flowing': (
              <View style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderColor: 'rgba(34, 197, 94, 0.2)',
                borderWidth: 1,
                borderRadius: 8,
                padding: 8,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <Ionicons name="checkmark-circle-outline" size={14} color="#22C55E" style={{ marginRight: 6 }} />
                <Text style={{ color: '#22C55E', fontSize: 12, fontWeight: 'bold' }}>
                  AI predicts congestion clearing soon
                </Text>
              </View>
            )
          } as Record<string, React.ReactNode>)[`${item.status}-${prediction.status}`] || null
        )}

        <View style={styles.row3}>
          <TouchableOpacity
            style={styles.outlineButton}
            activeOpacity={0.7}
            onPress={() => onReport(item)}
          >

            <Text style={styles.outlineButtonText}>Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fillButton}
            activeOpacity={0.85}
            onPress={() => onBookRide(item)}
          >
            <Text style={styles.fillButtonText}>Book Ride</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: 'rgba(139,92,246,0.3)',
              backgroundColor: 'rgba(139,92,246,0.08)',
            }}
            onPress={() => onPredict(item)}
          >
            <Ionicons name="analytics-outline" size={14} color="#A78BFA" />
            <Text style={{ color: '#A78BFA', fontSize: 12, fontWeight: '600' }}>
              Predict
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: 'rgba(59,130,246,0.2)',
            backgroundColor: 'rgba(59,130,246,0.05)',
            marginTop: 10,
          }}
          onPress={() => {
            onSetReminder(item);
          }}
        >
          <Ionicons name="alarm-outline" size={14} color="#60A5FA" />
          <Text style={{ color: '#60A5FA', fontSize: 12, fontWeight: '600' }}>
            Remind me
          </Text>
        </TouchableOpacity>
      </View>
      </Animated.View>
    </TouchableOpacity>
  );
}


export default function StationsScreen() {
  const insets = useSafeAreaInsets();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [reminderStation, setReminderStation] = useState<Station | null>(null);
  const [showReminder, setShowReminder] = useState(false);
  const [reportStation, setReportStation] = useState<Station | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [rideStation, setRideStation] = useState<Station | null>(null);
  const [showRide, setShowRide] = useState(false);
  const [predictStationItem, setPredictStationItem] = useState<Station | null>(null);
  const [showPredict, setShowPredict] = useState(false);






  useEffect(() => {

    const unsubscribe = subscribeToStations((data) => {
      setStations(data);
      if (loading) setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    stations.forEach(station => {
      predictStation(station.lat, station.lng)
        .then(result => {
          if (result) {
            setPredictions(prev => ({
              ...prev,
              [station.id]: result
            }))
          }
        })
    })
  }, [stations])


  const filteredStations = stations.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={18} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stations..."
            placeholderTextColor="#475569"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
        {searchQuery.length > 0 && (
          <Text style={styles.resultCountText}>{filteredStations.length} stations found</Text>
        )}
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
      ) : filteredStations.length === 0 && searchQuery.length > 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={48} color="#1E3A5A" />
          <Text style={styles.emptyStateTitle}>No stations found</Text>
          <Text style={styles.emptyStateSubtitle}>Try a different search</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStations}
          renderItem={({ item, index }) => (
            <AnimatedStationCard 
              item={item} 
              index={index} 
              predictions={predictions}
              onSetReminder={(station) => {
                setReminderStation(station);
                setShowReminder(true);
              }}
              onReport={(station) => {
                setReportStation(station);
                setShowReport(true);
              }}
              onBookRide={(station) => {
                setRideStation(station);
                setShowRide(true);
              }}
              onPredict={(station) => {
                setPredictStationItem(station);
                setShowPredict(true);
              }}
            />



          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 120, // space for tab bar
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <SetReminderModal
        visible={showReminder}
        station={reminderStation}
        onClose={() => setShowReminder(false)}
        onSaved={() => {
          setShowReminder(false);
          Alert.alert(
            'Reminder Set!', 
            `We will check ${reminderStation?.name} status for you daily.`
          );
        }}
      />

      <ReportStatusSheet
        visible={showReport}
        station={reportStation}
        onClose={() => setShowReport(false)}
        onReported={(status) => {
          Alert.alert(
            '✅ Report submitted!',
            `Thanks for reporting ${reportStation?.name} as ${status}. You earned 10 MovePal points!`
          );
        }}
      />

      <RideOptions visible={showRide} station={rideStation} onClose={() => setShowRide(false)} />
      
      <PredictTimeSheet
        visible={showPredict}
        station={predictStationItem}
        onClose={() => setShowPredict(false)}
      />
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
    fontWeight: '700',
    color: '#F1F5F9',
  },
  stationAddress: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: '#030816',
  },
  searchInputContainer: {
    backgroundColor: '#0A1628',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F1F5F9',
    fontSize: 14,
  },
  resultCountText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    marginLeft: 4,
  },
  predictionPill: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  predictionPillText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyStateTitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
  },
});
