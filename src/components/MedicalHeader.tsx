import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

interface MedicalHeaderProps {
  title: string;
  subtitle?: string;
  showIcons?: boolean;
}

export default function MedicalHeader({ title, subtitle, showIcons = true }: MedicalHeaderProps) {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.logoContainer}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="medical-bag" size={32} color={theme.colors.text.onPrimary} />
        </View>
        <Text variant="headlineLarge" style={styles.title}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="titleMedium" style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
        {showIcons && (
          <View style={styles.medicineIcons}>
            <MaterialCommunityIcons name="pill" size={20} color="rgba(255, 255, 255, 0.7)" />
            <MaterialCommunityIcons name="hospital" size={20} color="rgba(255, 255, 255, 0.7)" />
            <MaterialCommunityIcons name="heart-pulse" size={20} color="rgba(255, 255, 255, 0.7)" />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  logoContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.shadows.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
    fontWeight: 'bold',
    color: theme.colors.text.onPrimary,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  medicineIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
});
