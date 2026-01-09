import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
  onPress?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle,
  onPress,
}) => {
  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <MaterialCommunityIcons name={icon as any} size={32} color={color} />
          </View>
          <View style={styles.textContainer}>
            <Text variant="labelMedium" style={styles.title}>
              {title}
            </Text>
            <Text variant="headlineSmall" style={styles.value}>
              {value}
            </Text>
            {subtitle && (
              <Text variant="bodySmall" style={styles.subtitle}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 8,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    color: '#999',
  },
});