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
  Chip,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { InventoryStackParamList } from '../../navigation/MainNavigator';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';
import MedicalBackground from '../../components/MedicalBackground';
import MedicalHeader from '../../components/MedicalHeader';

interface ProductDetails {
  _id: string;
  medicineName: string; // This is actually the generic name
  batchNumber: string;
  quantity: number;
  soldQuantity: number;
  damagedQuantity: number;
  expiryDate: string;
  manufactureDate: string;
  supplier?: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  status: 'active' | 'low_stock' | 'expired' | 'near_expiry' | 'out_of_stock';
  medicine?: {
    _id: string;
    name: string; // This is the brand name
    genericName?: string;
    category?: string;
    manufacturer?: string;
    dosageForm?: string;
    strength?: string;
    description?: string;
    barcode?: string;
    sku?: string;
  };
  availableQuantity?: number;
  daysUntilExpiry?: number;
  reorderLevel?: number;
  expiryAlertDays?: number;
  supplierInvoiceNumber?: string;
  purchaseDate?: string;
  isActive?: boolean;
  isExpired?: boolean;
  isNearExpiry?: boolean;
  profitMargin?: number;
  profitPercentage?: number;
}

export default function ProductDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation<StackNavigationProp<InventoryStackParamList>>();
  const { productId } = route.params as { productId: string };
  
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProductDetails = async () => {
    try {
      console.log('Making API call to:', `/inventory/${productId}`);
      const response = await api.get(`/inventory/${productId}`);
      console.log('Full response object:', response);
      console.log('Response status:', response.status);
      console.log('Response data type:', typeof response.data);
      console.log('Response data value:', response.data);
      console.log('Response data keys:', response.data ? Object.keys(response.data) : 'undefined');
      
      const inventoryData = response.data as any;
      console.log('Setting product data:', inventoryData);
      console.log('Product has medicineName:', !!inventoryData.medicineName);
      setProduct(inventoryData);
      console.log('Product state set successfully');
    } catch (error) {
      console.error('Error fetching product details:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return '#4CAF50';
      case 'low_stock': return '#FF9800';
      case 'out_of_stock': return '#F44336';
      default: return '#666';
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getAvailableQuantity = () => {
    if (!product) return 0;
    return product.quantity - product.soldQuantity - product.damagedQuantity;
  };

  const handleEdit = () => {
    if (product?._id) {
      navigation.navigate('EditProduct', { productId: product._id });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/inventory/${productId}`);
              Alert.alert('Success', 'Product deleted successfully');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <MedicalBackground variant="light">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading product details...</Text>
        </View>
      </MedicalBackground>
    );
  }

  if (!product) {
    console.log('Product is null or undefined, rendering not found');
    return (
      <MedicalBackground variant="light">
        <View style={styles.centered}>
          <Icon name="package-variant-closed" size={64} color="#ccc" />
          <Text style={styles.errorText}>Product not found</Text>
        </View>
      </MedicalBackground>
    );
  }

  console.log('Rendering product details, product:', product);
  console.log('Product medicineName:', product.medicineName);

  const availableQuantity = getAvailableQuantity();
  const daysUntilExpiry = getDaysUntilExpiry(product.expiryDate);

  return (
    <MedicalBackground variant="light">
      <ScrollView style={styles.container}>
        <MedicalHeader 
          title="Product Details" 
          subtitle={product.medicine?.name || product.medicineName}
          showIcons={false}
        />

        {/* Product Info Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.headerRow}>
              <Text variant="headlineMedium" style={styles.productName}>
                {product.medicine?.name || product.medicineName}
              </Text>
              <Chip
                style={[styles.statusChip, { backgroundColor: getStatusColor(product.status) }]}
              >
                <Text style={styles.statusText}>
                  {product.status.replace('_', ' ').toUpperCase()}
                </Text>
              </Chip>
            </View>

            <Divider style={styles.divider} />

            {/* Basic Information */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Basic Information</Text>
              
              <View style={styles.detailRow}>
                <Icon name="barcode" size={20} color="#666" />
                <Text style={styles.detailLabel}>Batch Number:</Text>
                <Text style={styles.detailValue}>{product.batchNumber}</Text>
              </View>

              <View style={styles.detailRow}>
                <Icon name="package-variant" size={20} color="#666" />
                <Text style={styles.detailLabel}>Available Quantity:</Text>
                <Text style={[styles.detailValue, { color: availableQuantity > 0 ? '#4CAF50' : '#F44336' }]}>
                  {availableQuantity} units
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Icon name="calendar" size={20} color="#666" />
                <Text style={styles.detailLabel}>Expiry Date:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(product.expiryDate, 'DD MMM YYYY')}
                </Text>
                <Text style={[
                  styles.expiryText,
                  { color: daysUntilExpiry <= 0 ? '#F44336' : daysUntilExpiry <= 30 ? '#FF9800' : '#4CAF50' }
                ]}>
                  ({daysUntilExpiry <= 0 ? 'Expired' : `${daysUntilExpiry} days left`})
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Icon name="calendar-check" size={20} color="#666" />
                <Text style={styles.detailLabel}>Manufacture Date:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(product.manufactureDate, 'DD MMM YYYY')}
                </Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Pricing Information */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Pricing Information</Text>
              
              <View style={styles.detailRow}>
                <Icon name="currency-inr" size={20} color="#666" />
                <Text style={styles.detailLabel}>Purchase Price:</Text>
                <Text style={styles.detailValue}>₹{product.purchasePrice}</Text>
              </View>

              <View style={styles.detailRow}>
                <Icon name="tag" size={20} color="#666" />
                <Text style={styles.detailLabel}>Selling Price:</Text>
                <Text style={styles.detailValue}>₹{product.sellingPrice}</Text>
              </View>

              <View style={styles.detailRow}>
                <Icon name="currency-usd" size={20} color="#666" />
                <Text style={styles.detailLabel}>MRP:</Text>
                <Text style={styles.detailValue}>₹{product.mrp}</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Supplier Information */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Supplier Information</Text>
              
              <View style={styles.detailRow}>
                <Icon name="truck" size={20} color="#666" />
                <Text style={styles.detailLabel}>Supplier:</Text>
                <Text style={styles.detailValue}>{product.supplier}</Text>
              </View>
            </View>

            {/* Medicine Details (if available) */}
            {product.medicine && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.section}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>Medicine Details</Text>
                  
                  {product.medicine.category && (
                    <View style={styles.detailRow}>
                      <Icon name="shape" size={20} color="#666" />
                      <Text style={styles.detailLabel}>Category:</Text>
                      <Text style={styles.detailValue}>{product.medicine.category}</Text>
                    </View>
                  )}

                  {product.medicine.manufacturer && (
                    <View style={styles.detailRow}>
                      <Icon name="factory" size={20} color="#666" />
                      <Text style={styles.detailLabel}>Manufacturer:</Text>
                      <Text style={styles.detailValue}>{product.medicine.manufacturer}</Text>
                    </View>
                  )}

                  {product.medicine.strength && (
                    <View style={styles.detailRow}>
                      <Icon name="scale-balance" size={20} color="#666" />
                      <Text style={styles.detailLabel}>Strength:</Text>
                      <Text style={styles.detailValue}>{product.medicine.strength}</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            icon="pencil"
            onPress={handleEdit}
            style={styles.editButton}
            buttonColor="#4CAF50"
          >
            Edit Product
          </Button>
          
          <Button
            mode="outlined"
            icon="delete"
            onPress={handleDelete}
            style={styles.deleteButton}
            textColor="#F44336"
          >
            Delete Product
          </Button>
        </View>
      </ScrollView>
    </MedicalBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  card: {
    margin: 16,
    borderRadius: 12,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  productName: {
    flex: 1,
    fontWeight: 'bold',
    marginRight: 16,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  expiryText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
  actionButtons: {
    padding: 16,
    gap: 12,
  },
  editButton: {
    paddingVertical: 8,
  },
  deleteButton: {
    paddingVertical: 8,
    borderColor: '#F44336',
  },
});