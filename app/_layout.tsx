import '../global.css';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Stack, router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from 'react-error-boundary'
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useNotifications } from '@/hooks/useNotifications';
import { storage } from '@/lib/storage';
import { useTheme } from '@/hooks/useTheme';
import { predictStation } from '@/services/prediction.service';
import { reportStatus } from '@/services/stations.service';
import { Alert, Linking } from 'react-native';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <View style={{ flex: 1, padding: 40, paddingTop: 80, backgroundColor: '#030816' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#EF4444' }}>
        App crashed
      </Text>
      <Text style={{ fontSize: 13, marginTop: 20, color: '#F1F5F9' }}>
        {error.message}
      </Text>
      <Text style={{ fontSize: 11, marginTop: 20, color: '#64748B' }}>
        {error.stack}
      </Text>
    </View>
  )
}

export default function RootLayout() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <RootLayoutContent />
    </ErrorBoundary>
  )
}

function RootLayoutContent() {
  const theme = useTheme();
  const [isReady, setIsReady] = useState(false);

  // Start watching notifications and station changes
  useNotifications('demo-user');

  useEffect(() => {
    async function prepare() {
      try {
        // Request location permission
        const { status: foreground } = await Location.requestForegroundPermissionsAsync();
        
        if (foreground === 'granted') {
          const { status: background } = await Location.requestBackgroundPermissionsAsync();
          if (background !== 'granted') {
            Alert.alert(
              'Enable Background Location',
              'To notify you when you\'re near a busy station and ask for a quick report, MovePal needs location access set to "Always Allow". This helps other commuters get accurate updates.',
              [
                { text: 'Not Now', style: 'cancel' },
                { 
                  text: 'Enable', 
                  onPress: () => Linking.openSettings() 
                }
              ]
            );
          }
        }

        // Request notification permission
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Notification permission not granted');
        }

        // Register station report category
        await Notifications.setNotificationCategoryAsync(
          'STATION_REPORT', 
          [
            {
              identifier: 'HEAVY',
              buttonTitle: '🔴 Heavy',
              options: { opensAppToForeground: false },
            },
            {
              identifier: 'MODERATE', 
              buttonTitle: '🟡 Moderate',
              options: { opensAppToForeground: false },
            },
            {
              identifier: 'FLOWING',
              buttonTitle: '🟢 Flowing',
              options: { opensAppToForeground: false },
            },
          ]
        );

        // Console log Google Maps API key to verify it's loaded
        console.log('Google Maps API Key:', process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'NOT SET');

        // Check for session in storage
        const userFound = await storage.getUser();
        if (userFound) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/login');
        }
      } catch (e) {
        // Fallback or error tracking
        router.replace('/(auth)/login');
      } finally {
        setIsReady(true);
      }
    }


    prepare();

    // Handle notification when user taps it
    const subscription = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const { actionIdentifier, notification } = response
        const data = notification.request.content.data as any;
        const { stationId, stationLat, stationLng, stationName } = data;

        // Handle proximity report action buttons
        if (
          data?.type === 'proximity_report' &&
          ['HEAVY', 'MODERATE', 'FLOWING'].includes(actionIdentifier)
        ) {
          const status = actionIdentifier.toLowerCase() as 
            'heavy' | 'moderate' | 'flowing'
          
          try {
            await reportStatus(data.stationId, status)
            
            // Send thank you notification
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '✅ Thanks for reporting!',
                body: `Your report for ${data.stationName} helps other commuters. You earned 10 MovePal points!`,
                data: {},
              },
              trigger: null,
            })
            return; // Don't proceed with station check if it was a quick action
          } catch (err) {
            console.error('Failed to submit proximity report:', err)
          }
        }

        if (!stationLat || !stationLng) return


        // Get current prediction
        const prediction = await predictStation(
          Number(stationLat), 
          Number(stationLng)
        )

        if (!prediction) return

        const statusEmoji: Record<string, string> = {
          heavy: '🔴',
          moderate: '🟡', 
          flowing: '🟢'
        }

        const messages: Record<string, string> = {
          heavy: `${stationName} is heavily congested right now. Consider leaving early or booking a ride.`,
          moderate: `${stationName} is moderately busy. You should be fine but allow extra time.`,
          flowing: `${stationName} is flowing well right now. Good time to head out!`
        }

        // Send follow-up smart notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${statusEmoji[prediction.status] || ''} ${stationName} — MovePal`,
            body: messages[prediction.status] || '',
            data: { stationId },
          },
          trigger: null, // Send immediately
        })
      }
    )


    return () => subscription.remove();
  }, []);


  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#030816',
        }}
      >
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#030816' }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#030816' },
          animation: 'fade_from_bottom',
          animationDuration: 250,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
