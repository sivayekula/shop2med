import React, { useState } from 'react';
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
  Portal,
  Modal,
  List,
  Divider,
  Searchbar,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../services/api';


export default function AddProductScreen({ navigation }: any) {
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    batchNumber: '',
    quantity: '',
    purchasePrice: '',
    sellingPrice: '',
    mrp: '',
    supplier: '',
    supplierInvoiceNumber: '',
    rackNumber: '',
    shelfNumber: '',
    reorderLevel: '10',
    notes: '',
  });
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [manufactureDate, setManufactureDate] = useState(new Date());
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [showMfgPicker, setShowMfgPicker] = useState(false);
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
  const handleSubmit = async () => {
    if (!selectedMedicine) {
      Alert.alert('Error', 'Please select a medicine');
      return;
    }
    if (
      !formData.batchNumber ||
      !formData.quantity ||
      !formData.purchasePrice ||
      !formData.sellingPrice
    ) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/inventory', {
        medicine: selectedMedicine._id,
        batchNumber: formData.batchNumber,
        expiryDate: expiryDate.toISOString(),
        manufactureDate: manufactureDate.toISOString(),
        quantity: parseInt(formData.quantity),
        purchasePrice: parseFloat(formData.purchasePrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        mrp: formData.mrp ? parseFloat(formData.mrp) : undefined,
        supplier: formData.supplier || undefined,
        supplierInvoiceNumber: formData.supplierInvoiceNumber || undefined,
        rackNumber: formData.rackNumber || undefined,
        shelfNumber: formData.shelfNumber || undefined,
        reorderLevel: parseInt(formData.reorderLevel),
        notes: formData.notes || undefined,
      });

      Alert.alert('Success', 'Inventory added successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to add inventory',
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <ScrollView style={styles.container}>
      {/* Medicine Selection */}
      <Card style={styles.card}>
        <Card.Title title="Select Medicine" />
        <Card.Content>
          {selectedMedicine ? (
            <View style={styles.selectedMedicine}>
              <Text variant="titleMedium">{selectedMedicine.name}</Text>
              <Text variant="bodySmall">{selectedMedicine.manufacturer}</Text>
              <Button
                mode="text"
                onPress={() => {
                  setSelectedMedicine(null);
                  setModalVisible(true);
                }}
              >
                Change
              </Button>
            </View>
          ) : (
            <Button
              mode="outlined"
              onPress={() => setModalVisible(true)}
              icon="magnify"
            >
              Search Medicine
            </Button>
          )}
        </Card.Content>
      </Card>
      {/* Batch Information */}
      <Card style={styles.card}>
        <Card.Title title="Batch Information" />
        <Card.Content>
          <TextInput
            label="Batch Number *"
            value={formData.batchNumber}
            onChangeText={text =>
              setFormData({ ...formData, batchNumber: text })
            }
            style={styles.input}
            mode="outlined"
          />

          <TouchableOpacity onPress={() => setShowMfgPicker(true)}>
            <TextInput
              label="Manufacture Date *"
              value={manufactureDate.toLocaleDateString()}
              editable={false}
              style={styles.input}
              mode="outlined"
              right={<TextInput.Icon icon="calendar" />}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowExpiryPicker(true)}>
            <TextInput
              label="Expiry Date *"
              value={expiryDate.toLocaleDateString()}
              editable={false}
              style={styles.input}
              mode="outlined"
              right={<TextInput.Icon icon="calendar" />}
            />
          </TouchableOpacity>

          <TextInput
            label="Quantity *"
            value={formData.quantity}
            onChangeText={text => setFormData({ ...formData, quantity: text })}
            keyboardType="number-pad"
            style={styles.input}
            mode="outlined"
          />
        </Card.Content>
      </Card>

      {/* Pricing */}
      <Card style={styles.card}>
        <Card.Title title="Pricing" />
        <Card.Content>
          <TextInput
            label="Purchase Price *"
            value={formData.purchasePrice}
            onChangeText={text =>
              setFormData({ ...formData, purchasePrice: text })
            }
            keyboardType="decimal-pad"
            left={<TextInput.Affix text="₹" />}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Selling Price *"
            value={formData.sellingPrice}
            onChangeText={text =>
              setFormData({ ...formData, sellingPrice: text })
            }
            keyboardType="decimal-pad"
            left={<TextInput.Affix text="₹" />}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="MRP"
            value={formData.mrp}
            onChangeText={text => setFormData({ ...formData, mrp: text })}
            keyboardType="decimal-pad"
            left={<TextInput.Affix text="₹" />}
            style={styles.input}
            mode="outlined"
          />
        </Card.Content>
      </Card>

      {/* Supplier Information */}
      <Card style={styles.card}>
        <Card.Title title="Supplier Information" />
        <Card.Content>
          <TextInput
            label="Supplier Name"
            value={formData.supplier}
            onChangeText={text => setFormData({ ...formData, supplier: text })}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Invoice Number"
            value={formData.supplierInvoiceNumber}
            onChangeText={text =>
              setFormData({ ...formData, supplierInvoiceNumber: text })
            }
            style={styles.input}
            mode="outlined"
          />
        </Card.Content>
      </Card>

      {/* Storage Location */}
      <Card style={styles.card}>
        <Card.Title title="Storage Location" />
        <Card.Content>
          <TextInput
            label="Rack Number"
            value={formData.rackNumber}
            onChangeText={text =>
              setFormData({ ...formData, rackNumber: text })
            }
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Shelf Number"
            value={formData.shelfNumber}
            onChangeText={text =>
              setFormData({ ...formData, shelfNumber: text })
            }
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Reorder Level"
            value={formData.reorderLevel}
            onChangeText={text =>
              setFormData({ ...formData, reorderLevel: text })
            }
            keyboardType="number-pad"
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Notes"
            value={formData.notes}
            onChangeText={text => setFormData({ ...formData, notes: text })}
            multiline
            numberOfLines={3}
            style={styles.input}
            mode="outlined"
          />
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.submitButton}
      >
        Add Inventory
      </Button>

      {/* Date Pickers */}
      {showMfgPicker && (
        <DateTimePicker
          value={manufactureDate}
          mode="date"
          onChange={(event, date) => {
            setShowMfgPicker(false);
            if (date) setManufactureDate(date);
          }}
        />
      )}

      {showExpiryPicker && (
        <DateTimePicker
          value={expiryDate}
          mode="date"
          minimumDate={new Date()}
          onChange={(event, date) => {
            setShowExpiryPicker(false);
            if (date) setExpiryDate(date);
          }}
        />
      )}

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
            onChangeText={query => {
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
                onPress={() => {
                  setSelectedMedicine(medicine);
                  setModalVisible(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                <List.Item
                  title={medicine.name}
                  description={`${medicine.manufacturer || ''} - ${
                    medicine.strength || ''
                  }`}
                  left={props => <List.Icon {...props} icon="pill" />}
                />
                <Divider />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Button
            onPress={() => setModalVisible(false)}
            style={styles.modalClose}
          >
            Close
          </Button>
        </Modal>
      </Portal>
    </ScrollView>
  );
}
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
  selectedMedicine: {
    padding: 10,
    backgroundColor: '#E3F2FD',
    borderRadius: 5,
  },
  submitButton: {
    margin: 15,
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
