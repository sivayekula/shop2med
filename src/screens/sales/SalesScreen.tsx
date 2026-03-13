import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TouchableOpacity,
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

export default function SalesScreen({ navigation }: any) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSales = async () => {
    try {
      const response = await api.get('/sales');
      setSales(response.data.data);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSales();
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return 'cash';
      case 'card': return 'credit-card';
      case 'upi': return 'cellphone';
      default: return 'wallet';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      case 'returned': return '#FF9800';
      default: return '#757575';
    }
  };

  const renderItem = ({ item }: any) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('SaleDetails', { saleId: item._id })}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.billInfo}>
            <Text variant="titleMedium">{item.billNumber}</Text>
            <Text variant="bodySmall" style={styles.date}>
              {formatDate(item.saleDate, 'DD/MM/YYYY hh:mm A')}
            </Text>
          </View>
          <Chip
            style={{ backgroundColor: getStatusColor(item.status) }}
            textStyle={{ color: '#fff' }}
          >
            {item.status}
          </Chip>
        </View>

        <View style={styles.customerRow}>
          <Icon name="account" size={16} color="#666" />
          <Text variant="bodyMedium" style={styles.customerName}>
            {item.customerName || 'Walk-in Customer'}
          </Text>
        </View>

        {item.customerPhone && (
          <View style={styles.detailRow}>
            <Icon name="phone" size={16} color="#666" />
            <Text variant="bodySmall"> {item.customerPhone}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.paymentInfo}>
            <Icon name={getPaymentMethodIcon(item.paymentMethod)} size={20} color="#2196F3" />
            <Text variant="bodyMedium" style={styles.paymentMethod}>
              {item.paymentMethod.toUpperCase()}
            </Text>
          </View>
          <Text variant="titleLarge" style={styles.amount}>
            {formatCurrency(item.totalAmount)}
          </Text>
        </View>

        <View style={styles.itemsCount}>
          <Icon name="package-variant" size={14} color="#666" />
          <Text variant="bodySmall" style={styles.itemsText}>
            {' '}{item.items?.length || 0} items
          </Text>
        </View>
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
        placeholder="Search by bill number or customer..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={sales.filter((sale: any) =>
          sale.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sale.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
        )}
        renderItem={renderItem}
        keyExtractor={(item: any) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="receipt" size={64} color="#ccc" />
            <Text variant="titleMedium" style={styles.emptyText}>
              No sales found
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateSale')}
        label="New Sale"
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
  billInfo: {
    flex: 1,
  },
  date: {
    color: '#666',
    marginTop: 2,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  customerName: {
    marginLeft: 5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethod: {
    marginLeft: 5,
    color: '#2196F3',
  },
  amount: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  itemsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  itemsText: {
    color: '#666',
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