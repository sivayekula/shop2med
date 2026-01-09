import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function HomeScreen({ navigation }: any) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthStore();

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/reports/dashboard');
      setDashboard(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text variant="headlineSmall">Welcome back,</Text>
          <Text variant="titleLarge" style={styles.shopName}>
            {user?.shopName}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileTab', { screen: 'Profile' })}>
          <Icon name="account-circle" size={40} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {/* Today's Stats */}
      <View style={styles.statsRow}>
        <Card style={[styles.statCard, { backgroundColor: '#4CAF50' }]}>
          <Card.Content>
            <Text variant="labelMedium" style={styles.statLabel}>
              Today's Sales
            </Text>
            <Text variant="headlineMedium" style={styles.statValue}>
              {dashboard?.today.sales || 0}
            </Text>
            <Text variant="bodySmall" style={styles.statGrowth}>
              ↑ {dashboard?.today.growth || 0}%
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, { backgroundColor: '#2196F3' }]}>
          <Card.Content>
            <Text variant="labelMedium" style={styles.statLabel}>
              Today's Revenue
            </Text>
            <Text variant="headlineMedium" style={styles.statValue}>
              ₹{dashboard?.today.revenue || 0}
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Quick Actions */}
      <Text variant="titleLarge" style={styles.sectionTitle}>
        Quick Actions
      </Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('InventoryTab')}
        >
          <Icon name="package-variant-closed" size={40} color="#2196F3" />
          <Text variant="labelLarge">Add Stock</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('OrdersTab', { screen: 'CreateOrder' })}
        >
          <Icon name="cart-plus" size={40} color="#4CAF50" />
          <Text variant="labelLarge">New Sale</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('ProfileTab', { screen: 'Reports' })}
        >
          <Icon name="chart-line" size={40} color="#9C27B0" />
          <Text variant="labelLarge">Reports</Text>
        </TouchableOpacity>
      </View>

      {/* Alerts */}
      {dashboard?.alerts && (
        <>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Alerts
          </Text>
          
          {dashboard.alerts.lowStock > 0 && (
            <Card style={[styles.alertCard, { borderLeftColor: '#FF5722' }]}>
              <Card.Content>
                <View style={styles.alertRow}>
                  <Icon name="alert-circle" size={24} color="#FF5722" />
                  <View style={styles.alertText}>
                    <Text variant="titleMedium">Low Stock</Text>
                    <Text variant="bodyMedium">
                      {dashboard.alerts.lowStock} items running low
                    </Text>
                  </View>
                  <Button mode="text" onPress={() => navigation.navigate('Inventory')}>
                    View
                  </Button>
                </View>
              </Card.Content>
            </Card>
          )}

          {dashboard.alerts.expiringSoon > 0 && (
            <Card style={[styles.alertCard, { borderLeftColor: '#FF9800' }]}>
              <Card.Content>
                <View style={styles.alertRow}>
                  <Icon name="clock-alert" size={24} color="#FF9800" />
                  <View style={styles.alertText}>
                    <Text variant="titleMedium">Expiring Soon</Text>
                    <Text variant="bodyMedium">
                      {dashboard.alerts.expiringSoon} items expiring soon
                    </Text>
                  </View>
                  <Button mode="text" onPress={() => navigation.navigate('Inventory')}>
                    View
                  </Button>
                </View>
              </Card.Content>
            </Card>
          )}
        </>
      )}

      {/* Recent Sales */}
      <Text variant="titleLarge" style={styles.sectionTitle}>
        Recent Sales
      </Text>
      {dashboard?.recentSales?.map((sale: any) => (
        <Card key={sale._id} style={styles.saleCard}>
          <Card.Content>
            <View style={styles.saleRow}>
              <View style={styles.saleInfo}>
                <Text variant="titleMedium">{sale.billNumber}</Text>
                <Text variant="bodySmall">{sale.customerName || 'Walk-in'}</Text>
              </View>
              <View style={styles.saleAmount}>
                <Text variant="titleMedium">₹{sale.totalAmount}</Text>
                <Text variant="bodySmall">{sale.paymentMethod}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  shopName: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statsRow: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    elevation: 2,
  },
  statLabel: {
    color: '#fff',
    opacity: 0.9,
  },
  statValue: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 5,
  },
  statGrowth: {
    color: '#fff',
    marginTop: 5,
  },
  sectionTitle: {
    padding: 20,
    paddingBottom: 10,
    fontWeight: 'bold',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 10,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
  },
  alertCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertText: {
    flex: 1,
  },
  saleCard: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  saleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saleInfo: {
    flex: 1,
  },
  saleAmount: {
    alignItems: 'flex-end',
  },
});
