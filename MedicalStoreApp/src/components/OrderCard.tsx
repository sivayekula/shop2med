import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface OrderCardProps {
  order: {
    id: string;
    customerName: string;
    totalAmount: number;
    status: 'pending' | 'completed' | 'cancelled';
    date: string;
    itemCount: number;
  };
  onPress: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  const getStatusColor = () => {
    switch (order.status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getStatusIcon = () => {
    switch (order.status) {
      case 'completed':
        return 'check-circle';
      case 'pending':
        return 'clock-outline';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.leftSection}>
            <Text variant="labelSmall" style={styles.orderId}>
              Order #{order.id}
            </Text>
            <Text variant="titleMedium" style={styles.customerName}>
              {order.customerName}
            </Text>
          </View>
          <Chip
            icon={getStatusIcon()}
            style={[styles.statusChip, { backgroundColor: getStatusColor() + '20' }]}
            textStyle={[styles.statusText, { color: getStatusColor() }]}
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Chip>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar" size={16} color="#666" />
            <Text variant="bodySmall" style={styles.detailText}>
              {new Date(order.date).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="package-variant" size={16} color="#666" />
            <Text variant="bodySmall" style={styles.detailText}>
              {order.itemCount} items
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="currency-inr" size={16} color="#666" />
            <Text variant="bodyMedium" style={styles.amount}>
              ₹{order.totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leftSection: {
    flex: 1,
  },
  orderId: {
    color: '#666',
    marginBottom: 4,
  },
  customerName: {
    fontWeight: '600',
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
    color: '#666',
  },
  amount: {
    marginLeft: 4,
    fontWeight: '600',
    color: '#4CAF50',
  },
});