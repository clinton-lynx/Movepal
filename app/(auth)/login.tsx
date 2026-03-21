import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Pressable,
} from 'react-native';
import { router, Link } from 'expo-router';
import { authService } from '@/services/auth.service';
import { colors } from '@/constants/theme';

function AnimatedInput({
  label,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  value,
  onChangeText,
}: any) {
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#0F2040', '#3B82F6'], // dark-surface-alt to primary
  });

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: '#94A3B8', fontSize: 13, marginBottom: 8, fontWeight: '500' }}>
        {label}
      </Text>
      <Animated.View
        style={{
          borderWidth: 1,
          borderColor,
          borderRadius: 6,
          backgroundColor: '#0A1628',
        }}
      >
        <TextInput
          style={{
            color: '#F1F5F9',
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 15,
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.dark.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </Animated.View>
    </View>
  );
}

function AnimatedButton({ onPress, loading, title }: any) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={loading}
    >
      <Animated.View
        style={{
          backgroundColor: '#3B82F6',
          borderRadius: 8,
          paddingVertical: 16,
          alignItems: 'center',
          marginTop: 8,
          transform: [{ scale: scaleAnim }],
        }}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>{title}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await authService.login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#030816' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Radial Glow */}
      <View
        style={{
          position: 'absolute',
          top: -100,
          left: '50%',
          marginLeft: -150,
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: 'rgba(59,130,246,0.06)',
        }}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <Text
            style={{
              fontSize: 40,
              fontWeight: '800',
              color: '#3B82F6',
              letterSpacing: -1,
              marginBottom: 4,
            }}
          >
            MovePal
          </Text>
          <Text style={{ fontSize: 15, color: '#94A3B8' }}>Beat the crowd. Move smarter.</Text>
        </View>

        <View>
          <AnimatedInput
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <AnimatedInput
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? (
            <View
              style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                borderRadius: 6,
                paddingHorizontal: 16,
                paddingVertical: 12,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: '#EF4444', fontSize: 13 }}>{error}</Text>
            </View>
          ) : null}

          <AnimatedButton onPress={handleLogin} loading={loading} title="Sign In" />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
          <Text style={{ color: '#94A3B8', fontSize: 13 }}>Don&apos;t have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <Text style={{ color: '#3B82F6', fontSize: 13, fontWeight: '600' }}>Register</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
