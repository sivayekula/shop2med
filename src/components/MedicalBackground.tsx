import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

interface MedicalBackgroundProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'light';
}

export default function MedicalBackground({ children, variant = 'primary' }: MedicalBackgroundProps) {
  const getBackgroundStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryBackground;
      case 'secondary':
        return styles.secondaryBackground;
      case 'light':
        return styles.lightBackground;
      default:
        return styles.primaryBackground;
    }
  };

  const getOverlayStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryOverlay;
      case 'secondary':
        return styles.secondaryOverlay;
      case 'light':
        return styles.lightOverlay;
      default:
        return styles.primaryOverlay;
    }
  };

  return (
    <View style={styles.container}>
      <View style={getBackgroundStyle()}>
        <View style={getOverlayStyle()}>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  primaryBackground: {
    flex: 1,
    backgroundColor: '#4CAF50', // Medical green primary
  },
  secondaryBackground: {
    flex: 1,
    backgroundColor: '#2196F3', // Medical blue secondary
  },
  lightBackground: {
    flex: 1,
    backgroundColor: '#E8F5E9', // Light medical green
  },
  primaryOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  lightOverlay: {
    flex: 1,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
});
