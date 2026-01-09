/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
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
} from 'react-native-paper';
import { launchImageLibraryAsync, launchCameraAsync, MediaTypeOptions } from 'expo-image-picker';
import api from '../../services/api';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export default function CreateOrderScreen({ navigation }: any) {
  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);

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

      console.log('Uploading image:', image.uri);

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
      console.log('Error:', error);
      console.log('Error response:', error.response?.data);
      Alert.alert('Error', error.response?.data?.message || 'Failed to upload order');
    } finally {
      setLoading(false);
      setOcrProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Order Information" />
        <Card.Content>
          <TextInput
            label="Supplier Name (Optional)"
            value={supplierName}
            onChangeText={setSupplierName}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Notes (Optional)"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={styles.input}
            mode="outlined"
          />
        </Card.Content>
      </Card>

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
        💡 Tip: Ensure the invoice is clear and well-lit for best OCR results
      </Text>
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
  imageContainer: {
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginBottom: 10,
  },
  removeButton: {
    marginTop: 5,
  },
  uploadBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  uploadText: {
    marginTop: 10,
    color: '#2196F3',
  },
  uploadHint: {
    marginTop: 5,
    color: '#666',
    textAlign: 'center',
  },
  processingCard: {
    alignItems: 'center',
    padding: 20,
  },
  processingText: {
    marginTop: 15,
    fontWeight: 'bold',
  },
  processingHint: {
    marginTop: 5,
    color: '#666',
  },
  uploadButton: {
    margin: 15,
    paddingVertical: 8,
  },
  infoText: {
    textAlign: 'center',
    color: '#666',
    padding: 15,
  },
});