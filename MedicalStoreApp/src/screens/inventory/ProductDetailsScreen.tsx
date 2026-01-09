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
import { formatDate } from '../../utils/formatters';

export default function ProductDetailsScreen({ navigation }: any) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchInventory = async () => {
    try {
      const response = await api.get('/inventory', {
        params: filter !== 'all' ? { status: filter } : {},
      });
      setInventory(response.data.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'low_stock': return '#FF9800';
      case 'near_expiry': return '#FF5722';
      case 'expired': return '#F44336';
      case 'out_of_stock': return '#9E9E9E';
      default: return '#757575';
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const days = Math.ceil(
      (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const renderItem = ({ item }: any) => {
    const daysLeft = getDaysUntilExpiry(item.expiryDate);

    return (
      <Card style={styles.card} onPress={() => {}}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.medicineInfo}>
              <Text variant="titleMedium">
                {item.medicine?.name || 'Unknown'}
              </Text>
              <Text variant="bodySmall" style={styles.manufacturer}>
                {item.medicine?.manufacturer || ''}
              </Text>
            </View>
            <Chip
              style={{ backgroundColor: getStatusColor(item.status) }}
              textStyle={{ color: '#fff' }}
            >
              {item.status.replace('_', ' ')}
            </Chip>
          </View>

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Icon name="package-variant" size={16} color="#666" />
              <Text variant="bodyMedium"> Batch: {item.batchNumber}</Text>
            </View>

            <View style={styles.detailRow}>
              <Icon name="cube-outline" size={16} color="#666" />
              <Text variant="bodyMedium">
                {' '}Qty: {item.quantity - item.soldQuantity - item.damagedQuantity}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Icon name="calendar" size={16} color="#666" />
              <Text variant="bodyMedium">
                {' '}Expiry: {formatDate(item.expiryDate, 'DD/MM/YYYY')}
              </Text>
              {daysLeft <= 30 && daysLeft > 0 && (
                <Text style={{ color: '#FF5722', marginLeft: 5 }}>
                  ({daysLeft} days left)
                </Text>
              )}
              {daysLeft <= 0 && (
                <Text style={{ color: '#F44336', marginLeft: 5 }}>
                  (Expired)
                </Text>
              )}
            </View>

            <View style={styles.detailRow}>
              <Icon name="currency-inr" size={16} color="#666" />
              <Text variant="bodyMedium">
                {' '}MRP: ₹{item.mrp || item.sellingPrice}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

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
        placeholder="Search medicines..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <View style={styles.filters}>
        <Chip
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
          style={styles.filterChip}
        >
          All
        </Chip>
        <Chip
          selected={filter === 'low_stock'}
          onPress={() => setFilter('low_stock')}
          style={styles.filterChip}
        >
          Low Stock
        </Chip>
        <Chip
          selected={filter === 'near_expiry'}
          onPress={() => setFilter('near_expiry')}
          style={styles.filterChip}
        >
          Near Expiry
        </Chip>
        <Chip
          selected={filter === 'expired'}
          onPress={() => setFilter('expired')}
          style={styles.filterChip}
        >
          Expired
        </Chip>
      </View>

      <FlatList
        data={inventory.filter((item: any) =>
          item.medicine?.name.toLowerCase().includes(searchQuery.toLowerCase())
        )}
        renderItem={renderItem}
        keyExtractor={(item: any) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="package-variant-closed" size={64} color="#ccc" />
            <Text variant="titleMedium" style={styles.emptyText}>
              No inventory items found
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('InventoryTab', { screen: 'AddProduct' })}
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
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 8,
  },
  filterChip: {
    marginRight: 5,
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
  medicineInfo: {
    flex: 1,
  },
  manufacturer: {
    color: '#666',
    marginTop: 2,
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
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