import '../global.css';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { storage } from '@/lib/storage';
import { useTheme } from '@/hooks/useTheme';

export default function RootLayout() {
  const theme = useTheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Request location permission
        await Location.requestForegroundPermissionsAsync();

        // Console log Google Maps API key to verify it's loaded
        console.log('Google Maps API Key:', process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'NOT SET');

        // Bypass auth temporarily since there is no backend
        router.replace('/(tabs)');
      } catch (e) {
        // Fallback or error tracking
        router.replace('/(tabs)');
      } finally {
        setIsReady(true);
      }
    }

    prepare();
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
          animation: 'fade',
          animationDuration: 200,
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
