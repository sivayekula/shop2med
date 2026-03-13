import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricResult {
  success: boolean;
  error?: string;
  biometricType?: string;
}

class BiometricService {
  // Check if device supports biometric authentication
  async isSupported(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      return compatible;
    } catch (error) {
      console.error('BiometricService: Error checking support:', error);
      return false;
    }
  }

  // Get available biometric types
  async getBiometricTypes(): Promise<string[]> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      // Convert numeric types to readable strings
      const typeNames = types.map((type: number) => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'FINGERPRINT';
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return 'FACIAL_RECOGNITION';
          case LocalAuthentication.AuthenticationType.IRIS:
            return 'IRIS';
          default:
            return 'BIOMETRIC';
        }
      });
      
      return typeNames;
    } catch (error) {
      console.error('BiometricService: Error getting types:', error);
      return [];
    }
  }

  // Check if any biometrics are enrolled
  async hasEnrolledBiometrics(): Promise<boolean> {
    try {
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return enrolled;
    } catch (error) {
      console.error('BiometricService: Error checking enrollment:', error);
      return false;
    }
  }

  // Authenticate with biometrics
  async authenticate(promptMessage: string = 'Authenticate to continue'): Promise<BiometricResult> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Store biometric preference
        await AsyncStorage.setItem('biometricEnabled', 'true');
      }

      return result;
    } catch (error) {
      console.error('BiometricService: Authentication error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Enable biometric authentication for the user
  async enableBiometric(): Promise<BiometricResult> {
    try {
      // Check if biometrics are available and enrolled
      const isSupported = await this.isSupported();
      if (!isSupported) {
        return { success: false, error: 'Device does not support biometric authentication' };
      }

      const hasEnrolled = await this.hasEnrolledBiometrics();
      if (!hasEnrolled) {
        return { success: false, error: 'No biometrics enrolled on this device' };
      }

      // Test authentication
      const authResult = await this.authenticate('Enable biometric authentication');
      
      if (authResult.success) {
        await AsyncStorage.setItem('biometricEnabled', 'true');
        await AsyncStorage.setItem('biometricSetupDate', new Date().toISOString());
      }

      return authResult;
    } catch (error: any) {
      console.error('BiometricService: Error enabling biometric:', error);
      return { success: false, error: error.message || 'Failed to enable biometric authentication' };
    }
  }

  // Disable biometric authentication
  async disableBiometric(): Promise<void> {
    try {
      await AsyncStorage.removeItem('biometricEnabled');
      await AsyncStorage.removeItem('biometricSetupDate');
    } catch (error) {
      console.error('BiometricService: Error disabling biometric:', error);
      throw error;
    }
  }

  // Check if biometric authentication is enabled
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem('biometricEnabled');
      return enabled === 'true';
    } catch (error) {
      console.error('BiometricService: Error checking biometric status:', error);
      return false;
    }
  }

  // Get biometric setup date
  async getBiometricSetupDate(): Promise<string | null> {
    try {
      const date = await AsyncStorage.getItem('biometricSetupDate');
      return date;
    } catch (error) {
      console.error('BiometricService: Error getting setup date:', error);
      return null;
    }
  }

  // Authenticate for login (with fallback to stored credentials)
  async authenticateForLogin(): Promise<BiometricResult> {
    try {
      const isEnabled = await this.isBiometricEnabled();
      if (!isEnabled) {
        return { success: false, error: 'Biometric authentication not enabled' };
      }

      // Check if user has stored credentials
      const userEmail = await AsyncStorage.getItem('userEmail');
      const userPassword = await AsyncStorage.getItem('userPassword');
      
      if (!userEmail || !userPassword) {
        return { success: false, error: 'No stored credentials found' };
      }

      // Authenticate with biometrics
      const authResult = await this.authenticate('Login with biometric authentication');
      
      if (authResult.success) {
        return { success: true, biometricType: authResult.biometricType };
      }

      return authResult;
    } catch (error: any) {
      console.error('BiometricService: Biometric login error:', error);
      return { success: false, error: error.message || 'Biometric login failed' };
    }
  }

  // Store user credentials for biometric login
  async storeCredentials(email: string, password: string): Promise<void> {
    try {
      await AsyncStorage.setItem('userEmail', email);
      await AsyncStorage.setItem('userPassword', password);
    } catch (error) {
      console.error('BiometricService: Error storing credentials:', error);
    }
  }

  // Clear stored credentials
  async clearCredentials(): Promise<void> {
    try {
      await AsyncStorage.removeItem('userEmail');
      await AsyncStorage.removeItem('userPassword');
    } catch (error) {
      console.error('BiometricService: Error clearing credentials:', error);
    }
  }
}

export default new BiometricService();
