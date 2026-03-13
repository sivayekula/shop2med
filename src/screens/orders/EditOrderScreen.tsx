import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  ActivityIndicator,
  IconButton,
  Chip,
  Divider,
  List,
  Searchbar,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { OrdersStackParamList } from '../../navigation/MainNavigator';

type EditOrderScreenNavigationProp = StackNavigationProp<
  OrdersStackParamList,
  'EditOrder'
>;
type EditOrderScreenRouteProp = RouteProp<
  OrdersStackParamList,
  'EditOrder'
>;

interface Props {
  navigation: EditOrderScreenNavigationProp;
  route: EditOrderScreenRouteProp;
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  supplierName?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  supplierInvoiceNumber?: string;
  supplierInvoiceDate?: string;
  items: Array<{
    id?: string;
    medicine?: string;
    medicineName: string;
    manufacturer?: string;
    strength?: string;
    packing?: string;
    quantity: number;
    unitPrice?: number;
    mrp?: number;
    totalPrice?: number;
    isVerified?: boolean;
    isMatched?: boolean;
  }>;
  subtotal?: number;
  tax?: number;
  discount?: number;
  totalAmount?: number;
  status: string;
  paymentStatus: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Medicine {
  _id: string;
  name: string;
  genericName?: string;
  category?: string;
  manufacturer?: string;
  type?: string;
  dosageForm?: string;
  strength?: string;
  packing?: string;
  mrp?: number;
  description?: string;
}

interface OrderItemForm {
  medicineId?: string;
  medicineName: string;
  manufacturer?: string;
  type?: string;
  dosageForm?: string;
  strength?: string;
  packing?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function EditOrderScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<OrderItemForm[]>([]);
  const [showMedicineSearch, setShowMedicineSearch] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplierName: '',
    supplierPhone: '',
    supplierEmail: '',
    supplierInvoiceNumber: '',
    discount: 0,
    notes: '',
  });

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  useEffect(() => {
    // Check if order can be edited
    if (order) {
      const editableStatuses = ['draft', 'pending', 'confirmed'];
      if (!editableStatuses.includes(order.status)) {
        Alert.alert(
          'Cannot Edit',
          'This order cannot be edited because it has already been processed.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    }
  }, [order]);

  useEffect(() => {
    calculateTotals();
  }, [items]);

  const fetchOrderDetails = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      const orderData = response.data;
      setOrder(orderData);
      
      // Set form data
      setFormData({
        supplierName: orderData.supplierName || '',
        supplierPhone: orderData.supplierPhone || '',
        supplierEmail: orderData.supplierEmail || '',
        supplierInvoiceNumber: orderData.supplierInvoiceNumber || '',
        discount: orderData.discount || 0,
        notes: orderData.notes || '',
      });

      // Set items
      const orderItems = orderData.items.map((item: any) => ({
        medicineId: item.medicine?._id,
        medicineName: item.medicineName,
        manufacturer: item.manufacturer,
        dosageForm: item.dosageForm,
        strength: item.strength,
        packing: item.packing,
        quantity: item.quantity,
        unitPrice: item.unitPrice || 0,
        totalPrice: item.totalPrice || 0,
      }));
      setItems(orderItems);
    } catch (error) {
      console.error('Error fetching order:', error);
      Alert.alert('Error', 'Failed to load order details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const searchMedicines = async (query: string) => {
    if (!query.trim()) {
      // Load popular medicines when no query
      setSearchLoading(true);
      try {
        const response = await api.get('/medicines/popular?limit=10');
        setSearchResults(response.data.data || response.data);
      } catch (error) {
        console.error('Error fetching popular medicines:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
      return;
    }

    setSearchLoading(true);
    try {
      const response = await api.get(`/medicines/autocomplete?q=${encodeURIComponent(query)}&limit=10`);
      setSearchResults(response.data.data || response.data);
    } catch (error) {
      console.error('Error searching medicines:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchMedicines(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const selectMedicine = (medicine: Medicine, itemIndex: number) => {
    const updatedItems = [...items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      medicineId: medicine._id,
      medicineName: medicine.name,
      manufacturer: medicine.manufacturer,
      dosageForm: medicine.dosageForm,
      strength: medicine.strength,
      packing: medicine.packing,
      unitPrice: medicine.mrp || 0,
    };
    updatedItems[itemIndex].totalPrice = updatedItems[itemIndex].quantity * updatedItems[itemIndex].unitPrice;
    
    setItems(updatedItems);
    setShowMedicineSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateItem = (index: number, field: keyof OrderItemForm, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate total when quantity or unit price changes
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].totalPrice = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    setItems(updatedItems);
  };

  const addItem = () => {
    const newItem: OrderItemForm = {
      medicineName: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discount = formData.discount;
    const total = Math.max(0, subtotal - discount);
    
    return { subtotal, discount, total };
  };

  const handleSave = async () => {
    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    for (const item of items) {
      if (!item.medicineName.trim()) {
        Alert.alert('Error', 'Please select medicine for all items');
        return;
      }
      if (item.quantity <= 0) {
        Alert.alert('Error', 'Quantity must be greater than 0');
        return;
      }
    }

    setSaving(true);
    try {
      const totals = calculateTotals();
      const payload = {
        supplierName: formData.supplierName,
        supplierPhone: formData.supplierPhone,
        supplierEmail: formData.supplierEmail,
        supplierInvoiceNumber: formData.supplierInvoiceNumber,
        items: items.map(item => ({
          medicine: item.medicineId,
          medicineName: item.medicineName,
          manufacturer: item.manufacturer,
          dosageForm: item.dosageForm,
          strength: item.strength,
          packing: item.packing,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
        subtotal: totals.subtotal,
        discount: totals.discount,
        totalAmount: totals.total,
        notes: formData.notes,
      };

      console.log('Updating order with payload:', JSON.stringify(payload, null, 2));
      await api.patch(`/orders/${orderId}/with-items`, payload);
      Alert.alert('Success', 'Order updated successfully', [
        { text: 'View Orders', onPress: () => navigation.navigate('Orders') },
        { text: 'Stay Here', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.log('Error updating order:', error);
      console.log('Error response:', error.response);
      console.log('Error response data:', error.response?.data);
      
      let errorMessage = 'Failed to update order';
      
      if (error.response?.data) {
        const data = error.response.data;
        
        // Handle different message formats
        if (data.message) {
          if (Array.isArray(data.message)) {
            errorMessage = data.message.join(', ');
          } else if (typeof data.message === 'string') {
            errorMessage = data.message;
          }
        } else if (data.error) {
          if (Array.isArray(data.error)) {
            errorMessage = data.error.join(', ');
          } else if (typeof data.error === 'string') {
            errorMessage = data.error;
          }
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
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

  const totals = calculateTotals();

  return (
    <ScrollView style={styles.container}>
      {/* Order Header */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.orderNumber}>
            Edit Order #{order.orderNumber}
          </Text>
          <Text variant="bodySmall" style={styles.date}>
            {new Date(order.createdAt).toLocaleDateString()}
          </Text>
        </Card.Content>
      </Card>

      {/* Supplier Information */}
      <Card style={styles.card}>
        <Card.Title
          title="Supplier Information"
          titleVariant="titleMedium"
          left={(props) => <MaterialCommunityIcons name="truck" {...props} />}
        />
        <Card.Content>
          <TextInput
            label="Supplier Name"
            value={formData.supplierName}
            onChangeText={(value) => setFormData({ ...formData, supplierName: value })}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Phone Number"
            value={formData.supplierPhone}
            onChangeText={(value) => setFormData({ ...formData, supplierPhone: value })}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
          />
          <TextInput
            label="Email"
            value={formData.supplierEmail}
            onChangeText={(value) => setFormData({ ...formData, supplierEmail: value })}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
          />
          <TextInput
            label="Invoice Number"
            value={formData.supplierInvoiceNumber}
            onChangeText={(value) => setFormData({ ...formData, supplierInvoiceNumber: value })}
            style={styles.input}
            mode="outlined"
          />
        </Card.Content>
      </Card>

      {/* Order Items */}
      <Card style={styles.card}>
        <Card.Title
          title="Order Items"
          titleVariant="titleMedium"
          right={(props) => (
            <IconButton
              {...props}
              icon="plus"
              onPress={addItem}
            />
          )}
        />
        <Card.Content>
          {items.map((item, index) => (
            <View key={`order-item-${item.medicineId || index}`} style={styles.itemContainer}>
              <View style={styles.itemHeader}>
                <Text variant="titleMedium">Item {index + 1}</Text>
                {items.length > 1 && (
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => removeItem(index)}
                  />
                )}
              </View>
              
              <TouchableOpacity
                style={styles.medicineSelector}
                onPress={() => {
                  setEditingItemIndex(index);
                  setShowMedicineSearch(true);
                }}
              >
                <MaterialCommunityIcons name="pill" size={20} color="#666" />
                <Text style={styles.medicineSelectorText}>
                  {item.medicineName || 'Select Medicine'}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>

              <View style={styles.itemRow}>
                <View style={styles.itemField}>
                  <TextInput
                    label="Quantity"
                    value={item.quantity.toString()}
                    onChangeText={(value) => updateItem(index, 'quantity', parseInt(value) || 0)}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.smallInput}
                  />
                </View>
                <View style={styles.itemField}>
                  <TextInput
                    label="Unit Price"
                    value={item.unitPrice.toString()}
                    onChangeText={(value) => updateItem(index, 'unitPrice', parseFloat(value) || 0)}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.smallInput}
                  />
                </View>
                <View style={styles.itemField}>
                  <TextInput
                    label="Total"
                    value={formatCurrency(item.totalPrice)}
                    mode="outlined"
                    editable={false}
                    style={styles.smallInput}
                  />
                </View>
              </View>

              {item.manufacturer && (
                <Text variant="bodySmall" style={styles.itemDetails}>
                  Manufacturer: {item.manufacturer}
                </Text>
              )}
              {item.dosageForm && (
                <Text variant="bodySmall" style={styles.itemDetails}>
                  Dosage Form: {item.dosageForm}
                </Text>
              )}
              {item.strength && (
                <Text variant="bodySmall" style={styles.itemDetails}>
                  Strength: {item.strength}
                </Text>
              )}
              {item.packing && (
                <Text variant="bodySmall" style={styles.itemDetails}>
                  Packing: {item.packing}
                </Text>
              )}

              {index < items.length - 1 && <Divider style={styles.itemDivider} />}
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
            <Text variant="bodyMedium">{formatCurrency(totals.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <TextInput
              label="Discount"
              value={formData.discount.toString()}
              onChangeText={(value) => setFormData({ ...formData, discount: parseFloat(value) || 0 })}
              mode="outlined"
              keyboardType="numeric"
              style={styles.discountInput}
            />
          </View>
          <Divider style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text variant="titleMedium" style={styles.totalLabel}>
              Total Amount
            </Text>
            <Text variant="titleLarge" style={styles.totalAmount}>
              {formatCurrency(totals.total)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Notes */}
      <Card style={styles.card}>
        <Card.Title
          title="Notes"
          titleVariant="titleMedium"
          left={(props) => <MaterialCommunityIcons name="note-text" {...props} />}
        />
        <Card.Content>
          <TextInput
            label="Order Notes"
            value={formData.notes}
            onChangeText={(value) => setFormData({ ...formData, notes: value })}
            multiline
            numberOfLines={3}
            mode="outlined"
          />
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              style={styles.saveButton}
            >
              Save Changes
            </Button>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.bottomSpacing} />

      {/* Medicine Search Modal */}
      <Modal
        visible={showMedicineSearch}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <IconButton
              icon="close"
              onPress={() => {
                setShowMedicineSearch(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
            />
            <Text variant="titleLarge">
              {searchQuery.trim() ? 'Search Results' : 'Popular Medicines'}
            </Text>
            <View style={styles.placeholder} />
          </View>

          <Searchbar
            placeholder="Search medicines..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />

          {searchLoading ? (
            <View style={styles.searchLoading}>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <ScrollView style={styles.searchResults}>
              {searchResults.map((medicine) => (
                <List.Item
                  key={`medicine-${medicine._id}`}
                  title={medicine.name}
                  description={`${medicine.manufacturer || 'Unknown'} • ${medicine.dosageForm || 'N/A'} • ${medicine.strength || 'N/A'} • ${medicine.category || 'N/A'}`}
                  onPress={() => editingItemIndex !== null && selectMedicine(medicine, editingItemIndex)}
                  right={() => (
                    <Text variant="titleMedium" style={styles.medicinePrice}>
                      {formatCurrency(medicine.mrp || 0)}
                    </Text>
                  )}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
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
  orderNumber: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    color: '#666',
  },
  input: {
    marginBottom: 10,
  },
  itemContainer: {
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicineSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  medicineSelectorText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 8,
  },
  itemField: {
    flex: 1,
  },
  smallInput: {
    marginBottom: 8,
  },
  itemDetails: {
    color: '#666',
    marginBottom: 4,
  },
  itemDivider: {
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  discountInput: {
    flex: 1,
    maxWidth: 150,
  },
  divider: {
    marginVertical: 8,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalAmount: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  bottomSpacing: {
    height: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  placeholder: {
    width: 48,
  },
  searchBar: {
    margin: 16,
  },
  searchLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResults: {
    flex: 1,
  },
  medicinePrice: {
    marginRight: 16,
    color: '#4CAF50',
  },
});
