/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  Divider,
  ActivityIndicator,
  DataTable,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import api from '../../services/api';
import { formatDate, formatCurrency } from '../../utils/formatters';
export default function SaleDetailsScreen({ route, navigation }: any) {
  const { saleId } = route.params;
  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchSaleDetails = async () => {
    try {
      const response = await api.get(`/sales/${saleId}`);
      setSale(response.data);
    } catch (error) {
      console.error('Error fetching sale details:', error);
      Alert.alert('Error', 'Failed to load sale details');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchSaleDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!sale) {
    return (
      <View style={styles.centered}>
        <Text>Sale not found</Text>
      </View>
    );
  }
  return (
    <ScrollView style={styles.container}>
      {/* Bill Header */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <View>
              <Text variant="headlineSmall">{sale.billNumber}</Text>
              <Text variant="bodyMedium" style={styles.date}>
                {formatDate(sale.saleDate, 'DD/MM/YYYY hh:mm A')}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.statusText}>{sale.status}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      {/* Customer Info */}
      {(sale.customerName || sale.customerPhone) && (
        <Card style={styles.card}>
          <Card.Title title="Customer Information" />
          <Card.Content>
            {sale.customerName && (
              <View style={styles.infoRow}>
                <Icon name="account" size={20} color="#666" />
                <Text variant="bodyMedium" style={styles.infoText}>
                  {sale.customerName}
                </Text>
              </View>
            )}
            {sale.customerPhone && (
              <View style={styles.infoRow}>
                <Icon name="phone" size={20} color="#666" />
                <Text variant="bodyMedium" style={styles.infoText}>
                  {sale.customerPhone}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Items Table */}
      <Card style={styles.card}>
        <Card.Title title="Items" />
        <Card.Content>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Item</DataTable.Title>
              <DataTable.Title numeric>Qty</DataTable.Title>
              <DataTable.Title numeric>Price</DataTable.Title>
              <DataTable.Title numeric>Total</DataTable.Title>
            </DataTable.Header>

            {sale.items.map((item: any, index: number) => (
              <DataTable.Row key={index}>
                <DataTable.Cell>{item.medicineName}</DataTable.Cell>
                <DataTable.Cell numeric>{item.quantity}</DataTable.Cell>
                <DataTable.Cell numeric>
                  ₹{item.unitPrice.toFixed(2)}
                </DataTable.Cell>
                <DataTable.Cell numeric>
                  ₹{item.totalAmount.toFixed(2)}
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>

      {/* Payment Summary */}
      <Card style={styles.card}>
        <Card.Title title="Payment Summary" />
        <Card.Content>
          <View style={styles.summaryRow}>
            <Text variant="bodyLarge">Subtotal:</Text>
            <Text variant="bodyLarge">₹{sale.subtotal.toFixed(2)}</Text>
          </View>

          {sale.totalDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium">Discount:</Text>
              <Text variant="bodyMedium" style={{ color: '#4CAF50' }}>
                -₹{sale.totalDiscount.toFixed(2)}
              </Text>
            </View>
          )}

          {sale.totalTax > 0 && (
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium">Tax (GST):</Text>
              <Text variant="bodyMedium">₹{sale.totalTax.toFixed(2)}</Text>
            </View>
          )}

          <Divider style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text variant="titleLarge" style={styles.totalLabel}>
              Total:
            </Text>
            <Text variant="titleLarge" style={styles.totalAmount}>
              ₹{sale.totalAmount.toFixed(2)}
            </Text>
          </View>

          <View style={styles.paymentMethod}>
            <Icon name="cash" size={20} color="#2196F3" />
            <Text variant="bodyLarge" style={styles.paymentMethodText}>
              {sale.paymentMethod.toUpperCase()}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          mode="contained"
          icon="printer"
          style={styles.actionButton}
          onPress={() => {
            // TODO: Implement print
            Alert.alert('Print', 'Print functionality coming soon');
          }}
        >
          Print Bill
        </Button>

        <Button
          mode="outlined"
          icon="share-variant"
          style={styles.actionButton}
          onPress={() => {
            // TODO: Implement share
            Alert.alert('Share', 'Share functionality coming soon');
          }}
        >
          Share
        </Button>
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  date: {
    color: '#666',
    marginTop: 5,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    marginLeft: 10,
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  divider: {
    marginVertical: 10,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalAmount: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#E3F2FD',
    borderRadius: 5,
  },
  paymentMethodText: {
    marginLeft: 10,
    color: '#2196F3',
  },
  actions: {
    padding: 15,
    gap: 10,
  },
  actionButton: {
    paddingVertical: 8,
  },
});
