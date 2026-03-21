import React from 'react';
import { View, Text } from 'react-native';
import { StationStatus } from '@/types/station';

export default function StatusBadge({ status }: { status: StationStatus }) {
  const config = {
    heavy: { bg: 'rgba(239,68,68,0.15)', text: '#EF4444', label: 'Heavy' },
    moderate: { bg: 'rgba(249,115,22,0.15)', text: '#F97316', label: 'Moderate' },
    flowing: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E', label: 'Flowing' },
  };
  const c = config[status];

  return (
    <View
      style={{
        backgroundColor: c.bg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: c.text,
        }}
      />
      <Text
        style={{
          color: c.text,
          fontSize: 11,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {c.label}
      </Text>
    </View>
  );
}
