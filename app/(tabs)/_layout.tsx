import React, { useRef } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Animated, Pressable, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

const ACTIVE_COLOR = '#3B82F6';
const INACTIVE_COLOR = '#94A3B8';

function TabBarIcon({ routeName, isFocused }: { routeName: string; isFocused: boolean }) {
  const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;
  
  let iconName: keyof typeof Ionicons.glyphMap = 'help-circle-outline';

  if (routeName === 'index') {
    iconName = isFocused ? 'map' : 'map-outline';
  } else if (routeName === 'stations') {
    iconName = isFocused ? 'list' : 'list-outline';
  } else if (routeName === 'profile') {
    iconName = isFocused ? 'person' : 'person-outline';
  }

  return <Ionicons name={iconName} size={24} color={color} />;
}

function TabBarItem({
  route,
  index,
  isFocused,
  onPress,
}: {
  route: any;
  index: number;
  isFocused: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItemContainer}
    >
      <Animated.View style={[styles.tabItem, { transform: [{ scale }] }]}>
        <TabBarIcon routeName={route.name} isFocused={isFocused} />
        {isFocused && (
          <>
            <Animated.Text style={styles.activeLabel}>
              {route.name === 'index' ? 'Map' : route.name === 'stations' ? 'Stations' : 'Profile'}
            </Animated.Text>
            <View style={styles.activeDot} />
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.tabBarWrapper} pointerEvents="box-none">
      <BlurView intensity={30} tint="dark" style={styles.blurContainerSpacer}>
        <View style={styles.tabBar}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TabBarItem
                key={route.key}
                route={route}
                index={index}
                isFocused={isFocused}
                onPress={onPress}
              />
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="stations" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 32,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurContainerSpacer: {
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 22, 40, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 24,
    gap: 40,
  },
  tabItemContainer: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeLabel: {
    color: ACTIVE_COLOR,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ACTIVE_COLOR,
    position: 'absolute',
    bottom: -10,
  },
});
