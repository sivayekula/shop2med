/* eslint-disable @typescript-eslint/no-unused-vars */
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
  Switch,
  TextInput,
  Button,
  ActivityIndicator,
  List,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import biometricService from '../../services/biometricService';

interface SettingsData {
  notifications: {
    orderUpdates: boolean;
    promotions: boolean;
    lowStock: boolean;
    expiryAlerts: boolean;
  };
  preferences: {
    currency: string;
    language: string;
    theme: string;
    timezone?: string;
  };
  security: {
    twoFactorAuth: boolean;
    biometricLogin: boolean;
  };
  business: {
    storeName: string;
    gstNumber: string;
    licenseNumber: string;
  };
}

export default function SettingsScreen({ navigation }: any) {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  
  const { isBiometricEnabled } = useAuthStore();

  const fetchSettings = async () => {
    try {
      const response = await api.get('/users/settings');
      // Check biometric status
      const biometricStatus = await isBiometricEnabled();
      setBiometricEnabled(biometricStatus);
      
      // Ensure settings has proper default structure
      setSettings({
        notifications: {
          orderUpdates: false,
          promotions: false,
          lowStock: false,
          expiryAlerts: false,
          ...response.data.notifications,
        },
        preferences: {
          currency: 'INR',
          language: 'en',
          theme: 'light',
          ...response.data.preferences,
        },
        security: {
          twoFactorAuth: false,
          biometricLogin: false,
          ...response.data.security,
        },
        business: {
          storeName: '',
          gstNumber: '',
          licenseNumber: '',
          ...response.data.business,
        },
        ...response.data,
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert nested settings to flat structure matching backend DTO
      const flatSettings = {
        // Notification settings
        enableEmailNotifications: settings?.notifications?.orderUpdates || false,
        enableSMSNotifications: settings?.notifications?.promotions || false,
        enableLowStockAlerts: settings?.notifications?.lowStock || false,
        enableExpiryAlerts: settings?.notifications?.expiryAlerts || false,
        
        // Display settings
        currency: settings?.preferences?.currency || 'INR',
        locale: settings?.preferences?.language === 'en' ? 'en-IN' : 'en-US',
        timezone: settings?.preferences?.timezone || 'Asia/Kolkata',
        
        // Tax settings
        enableGST: settings?.business?.gstNumber ? true : false,
        
        // Default values for required fields
        defaultReorderLevel: 10,
        expiryAlertDays: 30,
        defaultTaxRate: 12,
        autoInvoiceNumber: true,
        invoicePrefix: 'BILL',
        invoiceFooter: 'Thank you for your business!',
        openingTime: '09:00 AM',
        closingTime: '09:00 PM',
        workingDays: 'Mon-Sat',
      };
      
      await api.patch('/users/settings', flatSettings);
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('SettingsScreen: Save error:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateNotification = (key: string, value: boolean) => {
    setSettings({
      ...settings,
      notifications: {
        orderUpdates: false,
        promotions: false,
        lowStock: false,
        expiryAlerts: false,
        ...settings?.notifications,
        [key]: value,
      },
      preferences: {
        currency: 'INR',
        language: 'en',
        theme: 'light',
        ...settings?.preferences,
      },
      security: {
        twoFactorAuth: false,
        biometricLogin: false,
        ...settings?.security,
      },
      business: {
        storeName: '',
        gstNumber: '',
        licenseNumber: '',
        ...settings?.business,
      },
    });
  };

  const updateSecurity = (key: string, value: boolean) => {
    setSettings({
      ...settings,
      notifications: {
        orderUpdates: false,
        promotions: false,
        lowStock: false,
        expiryAlerts: false,
        ...settings?.notifications,
      },
      preferences: {
        currency: 'INR',
        language: 'en',
        theme: 'light',
        ...settings?.preferences,
      },
      security: {
        twoFactorAuth: false,
        biometricLogin: false,
        ...settings?.security,
        [key]: value,
      },
      business: {
        storeName: '',
        gstNumber: '',
        licenseNumber: '',
        ...settings?.business,
      },
    });
  };

  const updateBusiness = (key: string, value: string) => {
    setSettings({
      ...settings,
      notifications: {
        orderUpdates: false,
        promotions: false,
        lowStock: false,
        expiryAlerts: false,
        ...settings?.notifications,
      },
      preferences: {
        currency: 'INR',
        language: 'en',
        theme: 'light',
        ...settings?.preferences,
      },
      security: {
        twoFactorAuth: false,
        biometricLogin: false,
        ...settings?.security,
      },
      business: {
        storeName: '',
        gstNumber: '',
        licenseNumber: '',
        ...settings?.business,
        [key]: value,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  if (!settings) {
    return (
      <View style={styles.centered}>
        <Text>Failed to load settings</Text>
        <Button mode="contained" onPress={fetchSettings} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Notifications Section */}
        <Card style={styles.card}>
          <Card.Title title="Notifications" titleVariant="titleLarge" />
          <Card.Content>
            <List.Item
              title="Order Updates"
              description="Get notified about order status changes"
              right={() => (
                <Switch
                  value={settings?.notifications?.orderUpdates || false}
                  onValueChange={(value) => updateNotification('orderUpdates', value)}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Promotions"
              description="Receive promotional offers and discounts"
              right={() => (
                <Switch
                  value={settings?.notifications?.promotions || false}
                  onValueChange={(value) => updateNotification('promotions', value)}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Low Stock"
              description="Get notified when inventory is running low"
              right={() => (
                <Switch
                  value={settings?.notifications?.lowStock || false}
                  onValueChange={(value) => updateNotification('lowStock', value)}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Expiry Alerts"
              description="Receive alerts for medicines nearing expiry"
              right={() => (
                <Switch
                  value={settings?.notifications?.expiryAlerts || false}
                  onValueChange={(value) => updateNotification('expiryAlerts', value)}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Security Section */}
        <Card style={styles.card}>
          <Card.Title title="Security" titleVariant="titleLarge" />
          <Card.Content>
            <List.Item
              title="Two-Factor Authentication"
              description="Add an extra layer of security to your account"
              right={() => (
                <Switch
                  value={settings?.security?.twoFactorAuth || false}
                  onValueChange={(value) => updateSecurity('twoFactorAuth', value)}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Biometric Login"
              description="Configure fingerprint or face recognition login"
              left={(props) => <List.Icon {...props} icon="fingerprint" />}
              right={() => (
                <View style={styles.biometricStatus}>
                  <Text style={styles.statusText}>
                    {biometricEnabled ? 'Enabled' : 'Disabled'}
                  </Text>
                  <Icon name="chevron-right" size={20} color="#666" />
                </View>
              )}
              onPress={() => navigation.navigate('BiometricSettings')}
            />
          </Card.Content>
        </Card>

        {/* Business Information Section */}
        <Card style={styles.card}>
          <Card.Title title="Business Information" titleVariant="titleLarge" />
          <Card.Content>
            <TextInput
              label="Store Name"
              value={settings?.business?.storeName || ''}
              onChangeText={(value) => updateBusiness('storeName', value)}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="GST Number"
              value={settings?.business?.gstNumber || ''}
              onChangeText={(value) => updateBusiness('gstNumber', value)}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Drug License Number"
              value={settings?.business?.licenseNumber || ''}
              onChangeText={(value) => updateBusiness('licenseNumber', value)}
              mode="outlined"
              style={styles.input}
            />
          </Card.Content>
        </Card>

        {/* Preferences Section */}
        <Card style={styles.card}>
          <Card.Title title="Preferences" titleVariant="titleLarge" />
          <Card.Content>
            <List.Item
              title="Currency"
              description={settings?.preferences?.currency || 'INR'}
              left={(props) => <List.Icon {...props} icon="currency-inr" />}
            />
            <Divider />
            <List.Item
              title="Language"
              description={settings?.preferences?.language || 'en'}
              left={(props) => <List.Icon {...props} icon="translate" />}
            />
            <Divider />
            <List.Item
              title="Theme"
              description={settings?.preferences?.theme || 'light'}
              left={(props) => <List.Icon {...props} icon="palette" />}
            />
          </Card.Content>
        </Card>

        {/* Save Button */}
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
          icon="content-save"
        >
          Save Settings
        </Button>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 20,
  },
  card: {
    margin: 10,
    marginBottom: 15,
    elevation: 2,
  },
  input: {
    marginBottom: 15,
  },
  saveButton: {
    margin: 20,
    marginTop: 10,
    paddingVertical: 8,
  },
  bottomSpacing: {
    height: 20,
  },
  biometricStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
});