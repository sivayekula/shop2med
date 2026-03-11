/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  ActivityIndicator,
  IconButton,
  Searchbar,
} from 'react-native-paper';
import { launchImageLibraryAsync, launchCameraAsync, MediaTypeOptions } from 'expo-image-picker';
import api from '../../services/api';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 10,
    elevation: 2,
  },
  input: {
    marginBottom: 10,
  },
  modeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  modeButton: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginHorizontal: 5,
  },
  activeMode: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  modeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activeModeText: {
    color: '#fff',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  removeButton: {
    marginTop: 10,
  },
  uploadBox: {
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 8,
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
  },
  uploadText: {
    marginTop: 10,
    color: '#2196F3',
  },
  uploadHint: {
    marginTop: 5,
    textAlign: 'center',
    color: '#666',
  },
  processingCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  processingText: {
    marginTop: 10,
  },
  processingHint: {
    marginTop: 5,
    textAlign: 'center',
    color: '#666',
  },
  uploadButton: {
    margin: 10,
  },
  infoText: {
    textAlign: 'center',
    margin: 10,
    color: '#666',
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  addButton: {
    backgroundColor: '#2196F3',
  },
  emptyItems: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    marginTop: 10,
    color: '#666',
  },
  itemContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  itemInput: {
    flex: 1,
    marginRight: 5,
  },
  halfInput: {
    flex: 0.5,
  },
  searchModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchModalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
    width: '90%',
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchBar: {
    marginBottom: 15,
  },
  searchLoading: {
    padding: 20,
    alignItems: 'center',
  },
  searchResults: {
    maxHeight: 300,
  },
  medicineItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  medicineName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  medicineDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
});

export default function CreateOrderScreen({ navigation }: any) {
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [creationMode, setCreationMode] = useState<'upload' | 'manual'>('upload');
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showMedicineSearch, setShowMedicineSearch] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  
  // Debounce ref for search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchBarRef = useRef<any>(null);

  // Medicine search functionality with debounce
  const searchMedicines = useCallback((query: string) => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Only clear results if query is truly empty (length 0)
    if (query.length === 0) {
      setSearchResults([]);
      return;
    }

    // Don't search if query is just whitespace
    if (!query.trim()) {
      return;
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await api.get(`/medicines/search?query=${encodeURIComponent(query)}`);
        setSearchResults(response.data.data || []);
      } catch (error) {
        console.error('Error searching medicines:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300); // 300ms delay
  }, []);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Focus search bar when modal opens
  React.useEffect(() => {
    if (showMedicineSearch && searchBarRef.current) {
      setTimeout(() => {
        searchBarRef.current?.focus();
      }, 100);
    }
  }, [showMedicineSearch]);

  // Add item to order
  const addItem = () => {
    const newItem = {
      medicineName: '',
      manufacturer: '',
      type: '',
      dosageForm: '',
      strength: '',
      packing: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    };
    setItems([...items, newItem]);
  };

  // Remove item from order
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Update item field
  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate total when quantity or unit price changes
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].totalPrice = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    setItems(updatedItems);
  };

  // Select medicine from search results
  const selectMedicine = (medicine: any, itemIndex: number) => {
    const updatedItems = [...items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      medicineId: medicine._id,
      medicineName: medicine.name,
      manufacturer: medicine.manufacturer,
      type: medicine.type,
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
    setEditingItemIndex(null);
  };

  // Manual order creation
  const handleCreateManualOrder = async () => {
    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one item to the order');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        supplierName,
        supplierPhone,
        supplierEmail,
        supplierInvoiceNumber,
        items: items.map(item => ({
          medicine: item.medicineId,
          medicineName: item.medicineName,
          manufacturer: item.manufacturer,
          type: item.type,
          dosageForm: item.dosageForm,
          strength: item.strength,
          packing: item.packing,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
        notes,
      };

      const response = await api.post('/orders', payload);

      Alert.alert(
        'Success',
        'Order created successfully',
        [
          {
            text: 'View Orders',
            onPress: () => navigation.navigate('OrdersTab'),
          },
        ]
      );
      
      // Reset form
      setSupplierName('');
      setSupplierPhone('');
      setSupplierEmail('');
      setSupplierInvoiceNumber('');
      setNotes('');
      setItems([]);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message;
      const displayMessage = Array.isArray(errorMessage) 
        ? errorMessage.join('\n') 
        : (errorMessage || 'Failed to create order');
      Alert.alert('Error', displayMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectImage = () => {
    Alert.alert('Select Image', 'Choose an option', [
      {
        text: 'Camera',
        onPress: async () => {
          try {
            const result = await launchCameraAsync({
              mediaTypes: MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              setImage(result.assets[0]);
            }
          } catch (error) {
            console.error('Camera error:', error);
            Alert.alert('Error', 'Failed to open camera');
          }
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          try {
            const result = await launchImageLibraryAsync({
              mediaTypes: MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              setImage(result.assets[0]);
            }
          } catch (error) {
            console.error('Gallery error:', error);
            Alert.alert('Error', 'Failed to open gallery');
          }
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const handleUploadOrder = async () => {
    if (!image) {
      Alert.alert('Error', 'Please select an invoice image');
      return;
    }

    setLoading(true);
    setOcrProcessing(true);

    try {
      const formData = new FormData();
      
      // Create a proper file object from the image
      const imageFile = {
        uri: image.uri,
        type: 'image/jpeg',
        name: 'invoice.jpg',
      };
      
      formData.append('image', imageFile as any);
      
      if (supplierName) {
        formData.append('supplierName', supplierName);
      }
      if (notes) {
        formData.append('notes', notes);
      }

      const response = await api.post('/orders/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });

      Alert.alert(
        'Success',
        'Order created successfully from invoice image',
        [
          {
            text: 'View Orders',
            onPress: () => navigation.navigate('OrdersTab'),
          },
        ]
      );
      
      // Reset form
      setSupplierName('');
      setNotes('');
      setImage(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message;
      const displayMessage = Array.isArray(errorMessage) 
        ? errorMessage.join('\n') 
        : (errorMessage || 'Failed to upload order');
      Alert.alert('Error', displayMessage);
    } finally {
      setLoading(false);
      setOcrProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Mode Selection */}
      <Card style={styles.card}>
        <Card.Title title="Order Creation Mode" />
        <Card.Content>
          <View style={styles.modeButtons}>
            <TouchableOpacity
              style={[styles.modeButton, creationMode === 'upload' && styles.activeMode]}
              onPress={() => setCreationMode('upload')}
            >
              <Icon name="camera-plus" size={24} color={creationMode === 'upload' ? '#fff' : '#666'} />
              <Text style={[styles.modeButtonText, creationMode === 'upload' && styles.activeModeText]}>
                Upload Invoice
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, creationMode === 'manual' && styles.activeMode]}
              onPress={() => setCreationMode('manual')}
            >
              <Icon name="pencil-plus" size={24} color={creationMode === 'manual' ? '#fff' : '#666'} />
              <Text style={[styles.modeButtonText, creationMode === 'manual' && styles.activeModeText]}>
                Manual Entry
              </Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>

      {/* Supplier Information */}
      <Card style={styles.card}>
        <Card.Title title="Supplier Information" />
        <Card.Content>
          <TextInput
            label="Supplier Name"
            value={supplierName}
            onChangeText={setSupplierName}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Supplier Phone"
            value={supplierPhone}
            onChangeText={setSupplierPhone}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
          />
          <TextInput
            label="Supplier Email"
            value={supplierEmail}
            onChangeText={setSupplierEmail}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
          />
          <TextInput
            label="Invoice Number"
            value={supplierInvoiceNumber}
            onChangeText={setSupplierInvoiceNumber}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={styles.input}
            mode="outlined"
          />
        </Card.Content>
      </Card>

      {creationMode === 'upload' ? (
        /* Upload Mode */
        <>
          <Card style={styles.card}>
            <Card.Title title="Invoice Image" />
            <Card.Content>
              {image ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: image.uri }} style={styles.image} />
                  <Button
                    mode="text"
                    onPress={() => setImage(null)}
                    style={styles.removeButton}
                  >
                    Remove Image
                  </Button>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadBox}
                  onPress={handleSelectImage}
                >
                  <Icon name="camera-plus" size={48} color="#2196F3" />
                  <Text variant="titleMedium" style={styles.uploadText}>
                    Take Photo or Select Image
                  </Text>
                  <Text variant="bodySmall" style={styles.uploadHint}>
                    Upload supplier invoice for OCR processing
                  </Text>
                </TouchableOpacity>
              )}
            </Card.Content>
          </Card>

          {ocrProcessing && (
            <Card style={styles.card}>
              <Card.Content style={styles.processingCard}>
                <ActivityIndicator size="large" />
                <Text variant="titleMedium" style={styles.processingText}>
                  Processing OCR...
                </Text>
                <Text variant="bodySmall" style={styles.processingHint}>
                  This may take a few moments
                </Text>
              </Card.Content>
            </Card>
          )}

          <Button
            mode="contained"
            onPress={handleUploadOrder}
            loading={loading}
            disabled={loading || !image}
            style={styles.uploadButton}
          >
            Upload & Process Order
          </Button>

          <Text variant="bodySmall" style={styles.infoText}>
            💡 Tip: Ensure invoice is clear and well-lit for best OCR results
          </Text>
        </>
      ) : (
        /* Manual Mode */
        <>
          <Card style={styles.card}>
            <View style={styles.itemsHeader}>
              <Text variant="titleMedium">Order Items</Text>
              <IconButton
                icon="plus"
                mode="contained"
                onPress={addItem}
                style={styles.addButton}
              />
            </View>
            <Card.Content>
              {items.length === 0 ? (
                <View style={styles.emptyItems}>
                  <Icon name="package-variant" size={48} color="#ccc" />
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    No items added yet
                  </Text>
                </View>
              ) : (
                <View>
                  {items.map((item, index) => (
                    <View key={`create-order-item-${item.medicineId || index}`} style={styles.itemContainer}>
                      <View style={styles.itemHeader}>
                        <Text variant="titleSmall">Item {index + 1}</Text>
                        <IconButton
                          icon="delete"
                          size={20}
                          onPress={() => removeItem(index)}
                          style={styles.deleteButton}
                        />
                      </View>
                      
                      <View style={styles.itemRow}>
                        <TextInput
                          label="Medicine Name"
                          value={item.medicineName}
                          onChangeText={(value) => updateItem(index, 'medicineName', value)}
                          style={styles.itemInput}
                          mode="outlined"
                          onFocus={() => {
                            setEditingItemIndex(index);
                            setSearchQuery(item.medicineName); // Set current medicine name as search query
                            setShowMedicineSearch(true);
                          }}
                        />
                      </View>

                      <View style={styles.itemRow}>
                        <TextInput
                          label="Manufacturer"
                          value={item.manufacturer}
                          onChangeText={(value) => updateItem(index, 'manufacturer', value)}
                          style={[styles.itemInput, styles.halfInput]}
                          mode="outlined"
                        />
                        <TextInput
                          label="Type"
                          value={item.type}
                          onChangeText={(value) => updateItem(index, 'type', value)}
                          style={[styles.itemInput, styles.halfInput]}
                          mode="outlined"
                        />
                      </View>

                      <View style={styles.itemRow}>
                        <TextInput
                          label="Dosage"
                          value={item.dosageForm}
                          onChangeText={(value) => updateItem(index, 'dosageForm', value)}
                          style={[styles.itemInput, styles.halfInput]}
                          mode="outlined"
                        />
                        <TextInput
                          label="Strength"
                          value={item.strength}
                          onChangeText={(value) => updateItem(index, 'strength', value)}
                          style={[styles.itemInput, styles.halfInput]}
                          mode="outlined"
                        />
                      </View>

                      <View style={styles.itemRow}>
                        <TextInput
                          label="Packing"
                          value={item.packing}
                          onChangeText={(value) => updateItem(index, 'packing', value)}
                          style={[styles.itemInput, styles.halfInput]}
                          mode="outlined"
                        />
                        <TextInput
                          label="Quantity"
                          value={item.quantity.toString()}
                          onChangeText={(value) => updateItem(index, 'quantity', parseInt(value) || 1)}
                          style={[styles.itemInput, styles.halfInput]}
                          mode="outlined"
                          keyboardType="numeric"
                        />
                      </View>

                      <View style={styles.itemRow}>
                        <TextInput
                          label="Unit Price"
                          value={item.unitPrice.toString()}
                          onChangeText={(value) => updateItem(index, 'unitPrice', parseFloat(value) || 0)}
                          style={[styles.itemInput, styles.halfInput]}
                          mode="outlined"
                          keyboardType="numeric"
                        />
                        <TextInput
                          label="Total Price"
                          value={item.totalPrice.toString()}
                          editable={false}
                          style={[styles.itemInput, styles.halfInput]}
                          mode="outlined"
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            onPress={handleCreateManualOrder}
            loading={loading}
            disabled={loading || items.length === 0}
            style={styles.uploadButton}
          >
            Create Order
          </Button>
        </>
      )}

      {/* Medicine Search Modal */}
      {showMedicineSearch && (
        <View style={styles.searchModal}>
          <View style={styles.searchModalContent}>
            <View style={styles.searchHeader}>
              <Text variant="titleMedium">Search Medicine</Text>
              <IconButton
                icon="close"
                onPress={() => {
                  setShowMedicineSearch(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              />
            </View>
            
            <Searchbar
              ref={searchBarRef}
              placeholder="Search medicines..."
              onChangeText={(text) => {
                setSearchQuery(text);
                searchMedicines(text);
              }}
              value={searchQuery}
              style={styles.searchBar}
            />

            {searchLoading ? (
              <View style={styles.searchLoading}>
                <ActivityIndicator size="large" />
              </View>
            ) : (
              <ScrollView style={styles.searchResults}>
                {searchResults.map((item) => (
                  <TouchableOpacity
                    key={`medicine-${item._id}`}
                    style={styles.medicineItem}
                    onPress={() => editingItemIndex !== null && selectMedicine(item, editingItemIndex)}
                  >
                    <View>
                      <Text variant="titleMedium">{item.name}</Text>
                      <Text variant="bodySmall">
                        {item.manufacturer || 'Unknown'} • {item.type || 'N/A'} • {item.dosageForm || item.strength || 'N/A'}
                      </Text>
                    </View>
                    <Text variant="titleMedium">
                      ₹{item.mrp || 0}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};
