import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Text, Button, Surface, List, Divider } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';
import biometricService from '../../services/biometricService';

export default function BiometricSettingsScreen({ navigation }: any) {
  const [isSupported, setIsSupported] = useState(false);
  const [hasEnrolled, setHasEnrolled] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometricTypes, setBiometricTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [setupDate, setSetupDate] = useState<string | null>(null);

  const { enableBiometric, disableBiometric } = useAuthStore();

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      const [supported, enrolled, enabled, types, date] = await Promise.all([
        biometricService.isSupported(),
        biometricService.hasEnrolledBiometrics(),
        biometricService.isBiometricEnabled(),
        biometricService.getBiometricTypes(),
        biometricService.getBiometricSetupDate(),
      ]);

      setIsSupported(supported);
      setHasEnrolled(enrolled);
      setIsEnabled(enabled);
      setBiometricTypes(types);
      setSetupDate(date);
    } catch (error) {
      console.error('BiometricSettings: Error checking status:', error);
    }
  };

  const handleToggleBiometric = async (value: boolean) => {
    setIsLoading(true);

    try {
      if (value) {
        await enableBiometric();
        setIsEnabled(true);
        await checkBiometricStatus(); // Refresh status
        Alert.alert('Success', 'Biometric authentication enabled successfully');
      } else {
        await disableBiometric();
        setIsEnabled(false);
        setSetupDate(null);
        Alert.alert('Success', 'Biometric authentication disabled successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to toggle biometric authentication');
      // Revert the switch state
      setIsEnabled(!value);
    } finally {
      setIsLoading(false);
    }
  };

  const getBiometricTypeText = () => {
    if (biometricTypes.length === 0) return 'Biometrics';
    
    const type = biometricTypes[0];
    switch (type) {
      case 'FINGERPRINT':
        return 'Fingerprint';
      case 'FACIAL_RECOGNITION':
        return 'Face ID';
      case 'IRIS':
        return 'Iris Scanner';
      default:
        return 'Biometrics';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return dateString;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Surface style={styles.surface}>
          <Text variant="headlineMedium" style={styles.title}>
            Biometric Authentication
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Use your biometrics to login quickly and securely
          </Text>

          <List.Section>
            <List.Item
              title="Device Support"
              description={
                isSupported
                  ? `This device supports ${getBiometricTypeText()}`
                  : 'This device does not support biometric authentication'
              }
              left={(props) => (
                <List.Icon {...props} icon={isSupported ? 'check-circle' : 'close-circle'} />
              )}
            />

            <Divider />

            <List.Item
              title="Biometrics Enrolled"
              description={
                hasEnrolled
                  ? `${getBiometricTypeText()} are enrolled on this device`
                  : 'No biometrics are enrolled on this device'
              }
              left={(props) => (
                <List.Icon {...props} icon={hasEnrolled ? 'fingerprint' : 'fingerprint-off'} />
              )}
            />

            <Divider />

            <List.Item
              title="Enable Biometric Login"
              description="Use biometrics instead of password for quick login"
              left={(props) => <List.Icon {...props} icon="login" />}
              right={() => (
                <Switch
                  value={isEnabled}
                  onValueChange={handleToggleBiometric}
                  disabled={!isSupported || !hasEnrolled || isLoading}
                />
              )}
            />

            {isEnabled && setupDate && (
              <>
                <Divider />
                <List.Item
                  title="Setup Date"
                  description={`Enabled on ${formatDate(setupDate)}`}
                  left={(props) => <List.Icon {...props} icon="calendar" />}
                />
              </>
            )}
          </List.Section>

          {!isSupported && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                Your device does not support biometric authentication. This feature requires a device with fingerprint, face recognition, or iris scanner.
              </Text>
            </View>
          )}

          {isSupported && !hasEnrolled && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                You need to enroll biometrics on your device first. Go to your device settings to set up {getBiometricTypeText()}.
              </Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.button}
            >
              Go Back
            </Button>
          </View>
        </Surface>
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
  surface: {
    margin: 20,
    padding: 20,
    borderRadius: 10,
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  button: {
    width: '100%',
    paddingVertical: 8,
  },
});
