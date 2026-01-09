import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Searchbar,
  Chip,
  ActivityIndicator,
  FAB,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import api from '../../services/api';
import { formatDate, formatCurrency } from '../../utils/formatters';

export default function OrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return '#4CAF50';
      case 'confirmed': return '#2196F3';
      case 'pending': return '#FF9800';
      case 'draft': return '#757575';
      case 'cancelled': return '#F44336';
      default: return '#757575';
    }
  };

  const getOcrStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'check-circle';
      case 'processing': return 'progress-clock';
      case 'failed': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  const renderItem = ({ item }: any) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.orderInfo}>
            <Text variant="titleMedium">{item.orderNumber}</Text>
            <Text variant="bodySmall" style={styles.date}>
              {formatDate(item.orderDate, 'DD/MM/YYYY')}
            </Text>
          </View>
          <Chip
            style={{ backgroundColor: getStatusColor(item.status) }}
            textStyle={{ color: '#fff' }}
          >
            {item.status}
          </Chip>
        </View>

        {item.supplierName && (
          <View style={styles.detailRow}>
            <Icon name="store" size={16} color="#666" />
            <Text variant="bodyMedium"> {item.supplierName}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Icon name="package-variant" size={16} color="#666" />
          <Text variant="bodySmall"> {item.items?.length || 0} items</Text>
        </View>

        {item.ocrStatus && (
          <View style={styles.ocrRow}>
            <Icon
              name={getOcrStatusIcon(item.ocrStatus)}
              size={16}
              color={item.ocrStatus === 'completed' ? '#4CAF50' : '#FF9800'}
            />
            <Text variant="bodySmall" style={styles.ocrText}>
              OCR: {item.ocrStatus}
            </Text>
          </View>
        )}

        {item.totalAmount && (
          <Text variant="titleLarge" style={styles.amount}>
            ₹{item.totalAmount.toFixed(2)}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search orders..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={orders.filter((order: any) =>
          order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.supplierName?.toLowerCase().includes(searchQuery.toLowerCase())
        )}
        renderItem={renderItem}
        keyExtractor={(item: any) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="clipboard-list" size={64} color="#ccc" />
            <Text variant="titleMedium" style={styles.emptyText}>
              No orders found
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateOrder')}
        label="New Order"
      />
    </View>
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
  searchbar: {
    margin: 10,
    elevation: 2,
  },
  card: {
    margin: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderInfo: {
    flex: 1,
  },
  date: {
    color: '#666',
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ocrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    padding: 5,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  ocrText: {
    marginLeft: 5,
    color: '#666',
  },
  amount: {
    marginTop: 10,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyText: {
    marginTop: 10,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#2196F3',
  },
});