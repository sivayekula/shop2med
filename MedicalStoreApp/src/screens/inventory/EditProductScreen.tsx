import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  ActivityIndicator,
  HelperText,
  Menu,
  Divider,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../services/api';
import { PRODUCT_CATEGORIES } from '../../utils/constants';
import { validateProduct } from '../../utils/validators';
import { InventoryStackParamList } from '../../navigation/MainNavigator';

type EditProductScreenNavigationProp = StackNavigationProp<
  InventoryStackParamList,
  'EditProduct'
>;
type EditProductScreenRouteProp = RouteProp<
  InventoryStackParamList,
  'EditProduct'
>;

interface Props {
  navigation: EditProductScreenNavigationProp;
  route: EditProductScreenRouteProp;
}

export default function EditProductScreen({ navigation, route }: Props) {
  const { productId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    manufacturer: '',
    mrp: '',
    sellingPrice: '',
    stock: '',
    minStock: '10',
    batchNumber: '',
    expiryDate: new Date(),
    barcode: '',
    sku: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      const response = await api.get(`/products/${productId}`);
      const product = response.data;

      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        manufacturer: product.manufacturer || '',
        mrp: product.mrp?.toString() || '',
        sellingPrice: product.sellingPrice?.toString() || '',
        stock: product.stock?.toString() || '',
        minStock: product.minStock?.toString() || '10',
        batchNumber: product.batchNumber || '',
        expiryDate: product.expiryDate ? new Date(product.expiryDate) : new Date(),
        barcode: product.barcode || '',
        sku: product.sku || '',
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', 'Failed to load product details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData({ ...formData, expiryDate: selectedDate });
    }
  };

  const handleSubmit = async () => {
    const validation = validateProduct({
      name: formData.name,
      category: formData.category,
      mrp: parseFloat(formData.mrp),
      sellingPrice: parseFloat(formData.sellingPrice),
      stock: parseInt(formData.stock),
      expiryDate: formData.expiryDate.toISOString(),
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        manufacturer: formData.manufacturer,
        mrp: parseFloat(formData.mrp),
        sellingPrice: parseFloat(formData.sellingPrice),
        stock: parseInt(formData.stock),
        minStock: parseInt(formData.minStock),
        batchNumber: formData.batchNumber,
        expiryDate: formData.expiryDate.toISOString(),
        barcode: formData.barcode,
        sku: formData.sku,
      };

      await api.put(`/products/${productId}`, payload);
      Alert.alert('Success', 'Product updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update product'
      );
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* Product Name */}
        <TextInput
          label="Product Name *"
          value={formData.name}
          onChangeText={(text) => handleUpdate('name', text)}
          mode="outlined"
          style={styles.input}
          error={!!errors.name}
        />
        <HelperText type="error" visible={!!errors.name}>
          {errors.name}
        </HelperText>

        {/* Description */}
        <TextInput
          label="Description"
          value={formData.description}
          onChangeText={(text) => handleUpdate('description', text)}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        {/* Category */}
        <Menu
          visible={categoryMenuVisible}
          onDismiss={() => setCategoryMenuVisible(false)}
          anchor={
            <TextInput
              label="Category *"
              value={formData.category}
              mode="outlined"
              style={styles.input}
              editable={false}
              right={
                <TextInput.Icon
                  icon="chevron-down"
                  onPress={() => setCategoryMenuVisible(true)}
                />
              }
              onPressIn={() => setCategoryMenuVisible(true)}
              error={!!errors.category}
            />
          }
        >
          {PRODUCT_CATEGORIES.map((category) => (
            <Menu.Item
              key={category}
              onPress={() => {
                handleUpdate('category', category);
                setCategoryMenuVisible(false);
              }}
              title={category}
            />
          ))}
        </Menu>
        <HelperText type="error" visible={!!errors.category}>
          {errors.category}
        </HelperText>

        {/* Manufacturer */}
        <TextInput
          label="Manufacturer"
          value={formData.manufacturer}
          onChangeText={(text) => handleUpdate('manufacturer', text)}
          mode="outlined"
          style={styles.input}
        />

        {/* MRP and Selling Price */}
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <TextInput
              label="MRP *"
              value={formData.mrp}
              onChangeText={(text) => handleUpdate('mrp', text)}
              mode="outlined"
              keyboardType="numeric"
              left={<TextInput.Icon icon="currency-inr" />}
              error={!!errors.mrp}
            />
            <HelperText type="error" visible={!!errors.mrp}>
              {errors.mrp}
            </HelperText>
          </View>

          <View style={styles.halfWidth}>
            <TextInput
              label="Selling Price *"
              value={formData.sellingPrice}
              onChangeText={(text) => handleUpdate('sellingPrice', text)}
              mode="outlined"
              keyboardType="numeric"
              left={<TextInput.Icon icon="currency-inr" />}
              error={!!errors.sellingPrice}
            />
            <HelperText type="error" visible={!!errors.sellingPrice}>
              {errors.sellingPrice}
            </HelperText>
          </View>
        </View>

        {/* Stock and Min Stock */}
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <TextInput
              label="Stock Quantity *"
              value={formData.stock}
              onChangeText={(text) => handleUpdate('stock', text)}
              mode="outlined"
              keyboardType="numeric"
              error={!!errors.stock}
            />
            <HelperText type="error" visible={!!errors.stock}>
              {errors.stock}
            </HelperText>
          </View>

          <View style={styles.halfWidth}>
            <TextInput
              label="Min Stock Level"
              value={formData.minStock}
              onChangeText={(text) => handleUpdate('minStock', text)}
              mode="outlined"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Batch Number */}
        <TextInput
          label="Batch Number"
          value={formData.batchNumber}
          onChangeText={(text) => handleUpdate('batchNumber', text)}
          mode="outlined"
          style={styles.input}
        />

        {/* Expiry Date */}
        <TextInput
          label="Expiry Date *"
          value={formData.expiryDate.toLocaleDateString()}
          mode="outlined"
          style={styles.input}
          editable={false}
          right={
            <TextInput.Icon
              icon="calendar"
              onPress={() => setShowDatePicker(true)}
            />
          }
          onPressIn={() => setShowDatePicker(true)}
          error={!!errors.expiryDate}
        />
        <HelperText type="error" visible={!!errors.expiryDate}>
          {errors.expiryDate}
        </HelperText>

        {showDatePicker && (
          <DateTimePicker
            value={formData.expiryDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Barcode */}
        <TextInput
          label="Barcode / SKU"
          value={formData.barcode}
          onChangeText={(text) => handleUpdate('barcode', text)}
          mode="outlined"
          style={styles.input}
          right={<TextInput.Icon icon="barcode-scan" />}
        />

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.button}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            loading={saving}
            disabled={saving}
          >
            Update Product
          </Button>
        </View>

        <View style={styles.bottomSpacing} />
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
  form: {
    padding: 16,
  },
  input: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  bottomSpacing: {
    height: 20,
  },
});