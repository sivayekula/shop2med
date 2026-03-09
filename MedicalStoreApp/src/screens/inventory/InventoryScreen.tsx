import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Searchbar, Button, Card, Text as PaperText, FAB } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { ProductCard } from '../../components/ProductCard';

interface InventoryItem {
  _id: string;
  medicineName: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  manufactureDate: string;
  supplier: string;
  purchasePrice: number;
  sellingPrice: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  medicine?: any;
}

type FilterType = 'all' | 'low_stock' | 'expiring_soon' | 'expired';

export default function InventoryScreen({ navigation }: any) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchInventory = useCallback(async (pageNum = 1, filter: FilterType = activeFilter, reset = false) => {
    try {
      if (reset) {
        setInventory([]);
        setPage(1);
        setHasMore(true);
      }

      let endpoint = '/inventory';
      const params: any = {
        page: pageNum,
        limit: 20,
      };

      // Add filters based on active tab
      if (filter === 'low_stock') {
        endpoint = '/inventory/search';
        params.status = 'low_stock';
      } else if (filter === 'expiring_soon') {
        endpoint = '/inventory/search';
        params.expiryTo = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        params.expiryFrom = new Date().toISOString();
      } else if (filter === 'expired') {
        endpoint = '/inventory/search';
        params.expiryTo = new Date().toISOString();
      }

      if (searchQuery) {
        params.query = searchQuery;
      }

      const response = await api.get(endpoint, { params });
      
      const newItems = response.data.data || [];
      const totalCount = response.data.total || 0;
      
      if (pageNum === 1) {
        setInventory(newItems);
      } else {
        setInventory(prev => [...prev, ...newItems]);
      }

      setTotal(totalCount);
      setHasMore(newItems.length === 20 && totalCount > inventory.length + newItems.length);
    } catch (error) {
      console.error('InventoryScreen: Fetch error:', error);
      Alert.alert('Error', 'Failed to load inventory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, searchQuery]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchInventory(1, activeFilter, true);
  }, [fetchInventory, activeFilter]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setLoading(true);
      fetchInventory(page + 1, activeFilter, false);
    }
  }, [fetchInventory, page, loading, hasMore, activeFilter]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchInventory(1, activeFilter, true);
    }, [fetchInventory, activeFilter])
  );

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setPage(1);
    setHasMore(true);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
    setHasMore(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return '#4CAF50';
      case 'low_stock':
        return '#FF9800';
      case 'out_of_stock':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getFilterStats = () => {
    const lowStock = inventory.filter(item => item.status === 'low_stock').length;
    const outOfStock = inventory.filter(item => item.status === 'out_of_stock').length;
    const expiringSoon = inventory.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
    }).length;
    const expired = inventory.filter(item => new Date(item.expiryDate) <= new Date()).length;

    return { lowStock, outOfStock, expiringSoon, expired };
  };

  const stats = getFilterStats();

  const renderFilterButton = (filter: FilterType, label: string, count: number, icon: string) => (
    <TouchableOpacity
      style={[styles.filterButton, activeFilter === filter && styles.activeFilter]}
      onPress={() => handleFilterChange(filter)}
    >
      <Icon name={icon} size={20} color={activeFilter === filter ? '#fff' : '#666'} />
      <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>
        {label}
      </Text>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderInventoryItem = ({ item }: { item: InventoryItem }) => (
    <ProductCard
      product={{
        id: item._id,
        name: item.medicineName,
        price: item.sellingPrice,
        stock: item.quantity,
        expiryDate: item.expiryDate,
        category: item.medicine?.category || 'General',
      }}
      onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
      onEdit={() => navigation.navigate('EditProduct', { productId: item._id })}
    />
  );

  if (loading && inventory.length === 0) {
    return (
      <View style={styles.centered}>
        <Icon name="loading" size={40} color="#2196F3" />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search medicines..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All Items', inventory.length, 'package-variant-closed')}
        {renderFilterButton('low_stock', 'Low Stock', stats.lowStock, 'alert-circle')}
        {renderFilterButton('expiring_soon', 'Expiring Soon', stats.expiringSoon, 'clock-alert')}
        {renderFilterButton('expired', 'Expired', stats.expired, 'alert-octagon')}
      </View>

      {/* Inventory List */}
      <FlatList
        data={inventory}
        renderItem={renderInventoryItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="package-variant" size={48} color="#BDBDBD" />
            <Text style={styles.emptyText}>No items found</Text>
            <Text style={styles.emptySubText}>
              {activeFilter === 'low_stock' && 'No items are currently low in stock'}
              {activeFilter === 'expiring_soon' && 'No items expiring in the next 30 days'}
              {activeFilter === 'expired' && 'No expired items found'}
              {activeFilter === 'all' && 'No inventory items found'}
            </Text>
          </View>
        )}
        contentContainerStyle={inventory.length === 0 ? styles.emptyContent : null}
      />

      {/* FAB for adding new items */}
      <FAB
        style={styles.fab}
        icon={() => <Icon name="plus-circle" size={24} color="#fff" />}
        onPress={() => navigation.navigate('AddProduct')}
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f8f9fa',
  },
  searchInput: {
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilter: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },
  activeFilterText: {
    color: '#fff',
  },
  badge: {
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyContent: {
    flex: 1,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
});
