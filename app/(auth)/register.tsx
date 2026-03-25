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
  Image,
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
    outputRange: ['#0F2040', '#3B82F6'],
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

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (error: any): string => {
    const errorCode = error.response?.data?.errorCode;
    const message = error.response?.data?.message;

    switch (errorCode) {
      case 'DUPLICATE_EMAIL':
        return 'This email is already registered. Try logging in.';
      case 'INVALID_CREDENTIALS':
        return 'Wrong email or password. Please try again.';
      case 'VALIDATION_ERROR':
        return message || 'Please check your inputs.';
      default:
        if (!error.response) {
          return 'Cannot connect to server. Check your internet.';
        }
        return message || 'Something went wrong. Try again.';
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await authService.register(name.trim(), email.trim(), password);
      router.replace('/(tabs)');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#030816' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
        <View style={{ alignItems: 'center', marginBottom: 48, gap: 8 }}>
          <Image 
            source={require('../../assets/images/icon.png')} 
            style={{ width: 80, height: 80, borderRadius: 16 }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 36,
                fontWeight: '900',
                color: '#FFFFFF',
                letterSpacing: -1.5,
              }}
            >
              Move
            </Text>
            <Text
              style={{
                fontSize: 36,
                fontWeight: '900',
                color: '#3B82F6',
                letterSpacing: -1.5,
              }}
            >
              Pal
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: '#64748B', fontStyle: 'italic' }}>
            Know before you go.
          </Text>
        </View>

        <View>
          <AnimatedInput
            label="Full Name"
            placeholder="John Doe"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
          />

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
            placeholder="Min. 6 characters"
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

          <AnimatedButton onPress={handleRegister} loading={loading} title="Create Account" />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
          <Text style={{ color: '#94A3B8', fontSize: 13 }}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text style={{ color: '#3B82F6', fontSize: 13, fontWeight: '600' }}>Sign In</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
