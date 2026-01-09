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
import api from '../../services/api';

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

export default function SettingsScreen() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/users/settings');
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
      await api.patch('/users/settings', settings);
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
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
    <ScrollView style={styles.container}>
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
            description="Use fingerprint or face recognition to login"
            right={() => (
              <Switch
                value={settings?.security?.biometricLogin || false}
                onValueChange={(value) => updateSecurity('biometricLogin', value)}
              />
            )}
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
});