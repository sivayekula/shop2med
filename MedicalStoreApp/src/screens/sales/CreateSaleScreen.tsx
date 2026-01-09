/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  IconButton,
  Searchbar,
  Portal,
  Modal,
  List,
  Divider,
  RadioButton,
} from 'react-native-paper';
import api from '../../services/api';

export default function CreateSaleScreen({ navigation }: any) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);

  const searchMedicines = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await api.get('/medicines/autocomplete', {
        params: { q: query },
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching medicines:', error);
    }
  };

  const addItem = async (medicine: any) => {
    try {
      // Get available inventory for this medicine
      const response = await api.get(`/inventory/medicine/${medicine._id}`);
      const inventory = response.data;

      if (inventory.length === 0) {
        Alert.alert('Error', 'No stock available for this medicine');
        return;
      }

      // Use first available inventory (FIFO)
      const firstAvailable = inventory.find((inv: any) => 
        inv.quantity - inv.soldQuantity - inv.damagedQuantity > 0
      );

      if (!firstAvailable) {
        Alert.alert('Error', 'No stock available');
        return;
      }

      setItems([
        ...items,
        {
          medicine: medicine._id,
          inventory: firstAvailable._id,
          medicineName: medicine.name,
          quantity: 1,
          unitPrice: firstAvailable.sellingPrice || firstAvailable.mrp,
          maxQuantity: firstAvailable.quantity - firstAvailable.soldQuantity - firstAvailable.damagedQuantity,
        },
      ]);
      setModalVisible(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const updateQuantity = (index: number, quantity: number) => {
    const newItems = [...items];
    if (quantity > newItems[index].maxQuantity) {
      Alert.alert('Error', `Only ${newItems[index].maxQuantity} units available`);
      return;
    }
    newItems[index].quantity = Math.max(1, quantity);
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const handleCreateSale = async () => {
    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        items: items.map(item => ({
          medicine: item.medicine,
          inventory: item.inventory,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        amountPaid: calculateTotal(),
        paymentMethod,
      };

      const response = await api.post('/sales', saleData);
      
      Alert.alert('Success', 'Sale created successfully', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('SaleDetails', { saleId: response.data._id }),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Customer Info */}
        <Card style={styles.card}>
          <Card.Title title="Customer Information" />
          <Card.Content>
            <TextInput
              label="Customer Name (Optional)"
              value={customerName}
              onChangeText={setCustomerName}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Phone Number (Optional)"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              keyboardType="phone-pad"
              style={styles.input}
              mode="outlined"
            />
          </Card.Content>
        </Card>

        {/* Items */}
        <Card style={styles.card}>
          <Card.Title
            title="Items"
            right={(props) => (
              <IconButton
                {...props}
                icon="plus"
                onPress={() => setModalVisible(true)}
              />
            )}
          />
          <Card.Content>
            {items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text variant="titleSmall">{item.medicineName}</Text>
                  <Text variant="bodySmall">₹{item.unitPrice} each</Text>
                </View>
                <View style={styles.itemActions}>
                  <IconButton
                    icon="minus"
                    size={20}
                    onPress={() => updateQuantity(index, item.quantity - 1)}
                  />
                  <Text variant="titleMedium">{item.quantity}</Text>
                  <IconButton
                    icon="plus"
                    size={20}
                    onPress={() => updateQuantity(index, item.quantity + 1)}
                  />
                  <Text variant="titleMedium" style={styles.itemTotal}>
                    ₹{(item.quantity * item.unitPrice).toFixed(2)}
                  </Text>
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => removeItem(index)}
                  />
                </View>
              </View>
            ))}

            {items.length === 0 && (
              <Text variant="bodyMedium" style={styles.emptyText}>
                No items added yet. Tap + to add medicines.
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Payment */}
        <Card style={styles.card}>
          <Card.Title title="Payment Method" />
          <Card.Content>
            <RadioButton.Group
              onValueChange={setPaymentMethod}
              value={paymentMethod}
            >
              <RadioButton.Item label="Cash" value="cash" />
              <RadioButton.Item label="UPI" value="upi" />
              <RadioButton.Item label="Card" value="card" />
            </RadioButton.Group>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text variant="titleLarge">Total:</Text>
          <Text variant="titleLarge" style={styles.totalAmount}>
            ₹{calculateTotal().toFixed(2)}
          </Text>
        </View>
        <Button
          mode="contained"
          onPress={handleCreateSale}
          loading={loading}
          disabled={loading || items.length === 0}
          style={styles.createButton}
        >
          Create Sale
        </Button>
      </View>

      {/* Search Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Search Medicine
          </Text>
          <Searchbar
            placeholder="Type medicine name..."
            onChangeText={(query) => {
              setSearchQuery(query);
              searchMedicines(query);
            }}
            value={searchQuery}
            style={styles.modalSearch}
          />
          <ScrollView style={styles.resultsContainer}>
            {searchResults.map((medicine: any) => (
              <TouchableOpacity
                key={medicine._id}
                onPress={() => addItem(medicine)}
              >
                <List.Item
                  title={medicine.name}
                  description={`${medicine.manufacturer || ''} - ${medicine.strength || ''}`}
                  left={(props) => <List.Icon {...props} icon="pill" />}
                />
                <Divider />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Button onPress={() => setModalVisible(false)} style={styles.modalClose}>
            Close
          </Button>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  card: {
    margin: 10,
    elevation: 2,
  },
  input: {
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  itemInfo: {
    flex: 1,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTotal: {
    minWidth: 80,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 20,
  },
  footer: {
    padding: 15,
    backgroundColor: '#fff',
    elevation: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalAmount: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  createButton: {
    paddingVertical: 8,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 15,
    fontWeight: 'bold',
  },
  modalSearch: {
    marginBottom: 15,
  },
  resultsContainer: {
    maxHeight: 300,
  },
  modalClose: {
    marginTop: 15,
  },
});