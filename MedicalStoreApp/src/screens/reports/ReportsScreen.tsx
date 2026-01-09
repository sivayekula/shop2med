import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  SegmentedButtons,
} from 'react-native-paper';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { LineChart, BarChart } from 'react-native-chart-kit';
import api from '../../services/api';

const screenWidth = Dimensions.get('window').width;

export default function ReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('month');
  const [salesReport, setSalesReport] = useState<any>(null);

  const fetchReports = async () => {
    try {
      const today = new Date();
      const dateFrom = new Date(today.getFullYear(), today.getMonth(), 1);
      const dateTo = new Date();

      const response = await api.get('/reports/sales', {
        params: {
          dateFrom: dateFrom.toISOString(),
          dateTo: dateTo.toISOString(),
          groupBy: period === 'month' ? 'daily' : 'monthly',
        },
      });
      setSalesReport(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const chartData = {
    labels:
      salesReport?.salesByPeriod
        ?.slice(0, 7)
        .map((item: any) => item._id.split('-').slice(-1)[0] || item._id) || [],
    datasets: [
      {
        data: salesReport?.salesByPeriod
          ?.slice(0, 7)
          .map((item: any) => item.revenue || 0) || [0],
      },
    ],
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Period Selector */}
      <Card style={styles.card}>
        <Card.Content>
          <SegmentedButtons
            value={period}
            onValueChange={setPeriod}
            buttons={[
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year' },
            ]}
          />
        </Card.Content>
      </Card>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <Card style={[styles.summaryCard, { backgroundColor: '#4CAF50' }]}>
          <Card.Content>
            <Text variant="labelSmall" style={styles.summaryLabel}>
              Total Sales
            </Text>
            <Text variant="headlineMedium" style={styles.summaryValue}>
              {salesReport?.summary?.totalSales || 0}
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.summaryCard, { backgroundColor: '#2196F3' }]}>
          <Card.Content>
            <Text variant="labelSmall" style={styles.summaryLabel}>
              Revenue
            </Text>
            <Text variant="headlineMedium" style={styles.summaryValue}>
              ₹{salesReport?.summary?.totalRevenue?.toFixed(0) || 0}
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Revenue Chart */}
      <Card style={styles.card}>
        <Card.Title title="Revenue Trend" />
        <Card.Content>
          {chartData.datasets[0].data.length > 0 ? (
            <LineChart
              data={chartData}
              width={screenWidth - 60}
              height={220}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#2196F3',
                },
              }}
              bezier
              style={styles.chart}
            />
          ) : (
            <Text style={styles.noData}>No data available</Text>
          )}
        </Card.Content>
      </Card>

      {/* Top Medicines */}
      <Card style={styles.card}>
        <Card.Title title="Top Selling Medicines" />
        <Card.Content>
          {salesReport?.topMedicines
            ?.slice(0, 5)
            .map((item: any, index: number) => (
              <View key={index} style={styles.topItem}>
                <View style={styles.topItemInfo}>
                  <Text variant="titleSmall">{item._id}</Text>
                  <Text variant="bodySmall" style={styles.topItemQuantity}>
                    Qty: {item.totalQuantity}
                  </Text>
                </View>
                <Text variant="titleMedium" style={styles.topItemRevenue}>
                  ₹{item.totalRevenue.toFixed(0)}
                </Text>
              </View>
            ))}
        </Card.Content>
      </Card>

      {/* Payment Methods */}
      <Card style={styles.card}>
        <Card.Title title="Payment Methods" />
        <Card.Content>
          {salesReport?.paymentBreakdown?.map((item: any, index: number) => (
            <View key={index} style={styles.paymentRow}>
              <Text variant="titleSmall" style={styles.paymentMethod}>
                {item._id.toUpperCase()}
              </Text>
              <View style={styles.paymentStats}>
                <Text variant="bodySmall">{item.count} sales</Text>
                <Text variant="titleMedium" style={styles.paymentAmount}>
                  ₹{item.totalAmount.toFixed(0)}
                </Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Export Button */}
      <Button
        mode="contained"
        icon="download"
        style={styles.exportButton}
        onPress={() => {
          // TODO: Implement export functionality
        }}
      >
        Export Report
      </Button>
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
    margin: 10,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    elevation: 2,
  },
  summaryLabel: {
    color: '#fff',
    opacity: 0.9,
  },
  summaryValue: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 5,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noData: {
    textAlign: 'center',
    padding: 30,
    color: '#666',
  },
  topItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  topItemInfo: {
    flex: 1,
  },
  topItemQuantity: {
    color: '#666',
    marginTop: 2,
  },
  topItemRevenue: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  paymentMethod: {
    flex: 1,
  },
  paymentStats: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  exportButton: {
    margin: 15,
    paddingVertical: 8,
  },
});
