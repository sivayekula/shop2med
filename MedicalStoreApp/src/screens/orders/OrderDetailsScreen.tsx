import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  Chip,
  Divider,
  List,
  IconButton,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { OrdersStackParamList } from '../../navigation/MainNavigator';

type OrderDetailsScreenNavigationProp = StackNavigationProp<
  OrdersStackParamList,
  'OrderDetails'
>;
type OrderDetailsScreenRouteProp = RouteProp<
  OrdersStackParamList,
  'OrderDetails'
>;

interface Props {
  navigation: OrderDetailsScreenNavigationProp;
  route: OrderDetailsScreenRouteProp;
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function OrderDetailsScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      Alert.alert('Error', 'Failed to load order details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
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

  const handleStatusUpdate = async (newStatus: 'completed' | 'cancelled') => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to mark this order as ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpdating(true);
            try {
              await api.patch(`/orders/${orderId}`, { status: newStatus });
              Alert.alert('Success', `Order marked as ${newStatus}`);
              fetchOrderDetails();
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to update order'
              );
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handlePrint = () => {
    Alert.alert('Print', 'Print functionality will be implemented');
  };

  const handleShare = () => {
    Alert.alert('Share', 'Share functionality will be implemented');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text>Order not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Order Header */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <View>
              <Text variant="titleLarge" style={styles.orderNumber}>
                Order #{order.orderNumber}
              </Text>
              <Text variant="bodySmall" style={styles.date}>
                {formatDate(order.createdAt, 'DD/MM/YYYY hh:mm A')}
              </Text>
            </View>
            <Chip
              icon={getStatusIcon(order.status)}
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(order.status) + '20' },
              ]}
              textStyle={[
                styles.statusText,
                { color: getStatusColor(order.status) },
              ]}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Customer Information */}
      <Card style={styles.card}>
        <Card.Title
          title="Customer Information"
          titleVariant="titleMedium"
          left={(props) => <MaterialCommunityIcons name="account" {...props} />}
        />
        <Card.Content>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account" size={20} color="#666" />
            <Text style={styles.infoText}>{order.customerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="phone" size={20} color="#666" />
            <Text style={styles.infoText}>{order.customerPhone}</Text>
          </View>
          {order.customerEmail && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="email" size={20} color="#666" />
              <Text style={styles.infoText}>{order.customerEmail}</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Order Items */}
      <Card style={styles.card}>
        <Card.Title
          title="Order Items"
          titleVariant="titleMedium"
          left={(props) => <MaterialCommunityIcons name="cart" {...props} />}
        />
        <Card.Content>
          {order.items.map((item, index) => (
            <View key={item.id}>
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text variant="bodyMedium" style={styles.itemName}>
                    {item.productName}
                  </Text>
                  <Text variant="bodySmall" style={styles.itemDetails}>
                    {formatCurrency(item.price)} × {item.quantity}
                  </Text>
                </View>
                <Text variant="bodyLarge" style={styles.itemTotal}>
                  {formatCurrency(item.total)}
                </Text>
              </View>
              {index < order.items.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Payment Summary */}
      <Card style={styles.card}>
        <Card.Title
          title="Payment Summary"
          titleVariant="titleMedium"
          left={(props) => (
            <MaterialCommunityIcons name="currency-inr" {...props} />
          )}
        />
        <Card.Content>
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium">Subtotal</Text>
            <Text variant="bodyMedium">{formatCurrency(order.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium">Tax (GST)</Text>
            <Text variant="bodyMedium">{formatCurrency(order.tax)}</Text>
          </View>
          {order.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium" style={styles.discountText}>
                Discount
              </Text>
              <Text variant="bodyMedium" style={styles.discountText}>
                -{formatCurrency(order.discount)}
              </Text>
            </View>
          )}
          <Divider style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text variant="titleMedium" style={styles.totalLabel}>
              Total Amount
            </Text>
            <Text variant="titleLarge" style={styles.totalAmount}>
              {formatCurrency(order.totalAmount)}
            </Text>
          </View>

          <View style={styles.paymentInfo}>
            <Chip icon="credit-card" style={styles.paymentChip}>
              {order.paymentMethod.toUpperCase()}
            </Chip>
            <Chip
              icon="check-circle"
              style={[
                styles.paymentChip,
                order.paymentStatus === 'completed'
                  ? styles.paidChip
                  : styles.pendingChip,
              ]}
            >
              {order.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Notes */}
      {order.notes && (
        <Card style={styles.card}>
          <Card.Title
            title="Notes"
            titleVariant="titleMedium"
            left={(props) => <MaterialCommunityIcons name="note-text" {...props} />}
          />
          <Card.Content>
            <Text variant="bodyMedium">{order.notes}</Text>
          </Card.Content>
        </Card>
      )}

      {/* Action Buttons */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              icon="printer"
              onPress={handlePrint}
              style={styles.actionButton}
            >
              Print
            </Button>
            <Button
              mode="outlined"
              icon="share-variant"
              onPress={handleShare}
              style={styles.actionButton}
            >
              Share
            </Button>
          </View>

          {order.status === 'pending' && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.statusButtons}>
                <Button
                  mode="contained"
                  icon="check-circle"
                  onPress={() => handleStatusUpdate('completed')}
                  style={[styles.statusButton, styles.completeButton]}
                  loading={updating}
                  disabled={updating}
                >
                  Mark as Completed
                </Button>
                <Button
                  mode="contained"
                  icon="close-circle"
                  onPress={() => handleStatusUpdate('cancelled')}
                  style={[styles.statusButton, styles.cancelButton]}
                  loading={updating}
                  disabled={updating}
                >
                  Cancel Order
                </Button>
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    color: '#666',
  },
  statusChip: {
    height: 32,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: '500',
    marginBottom: 4,
  },
  itemDetails: {
    color: '#666',
  },
  itemTotal: {
    fontWeight: '600',
    color: '#4CAF50',
  },
  divider: {
    marginVertical: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  discountText: {
    color: '#4CAF50',
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalAmount: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  paymentInfo: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  paymentChip: {
    backgroundColor: '#E3F2FD',
  },
  paidChip: {
    backgroundColor: '#E8F5E9',
  },
  pendingChip: {
    backgroundColor: '#FFF3E0',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  statusButtons: {
    marginTop: 16,
    gap: 12,
  },
  statusButton: {
    width: '100%',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  bottomSpacing: {
    height: 20,
  },
});