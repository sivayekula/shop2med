import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  View,
} from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';
import biometricService from '../../services/biometricService';
import { theme } from '../../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MedicalBackground from '../../components/MedicalBackground';
import MedicalHeader from '../../components/MedicalHeader';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  
  const { login, biometricLogin, isLoading, error, isAuthenticated } = useAuthStore();

  // Check for biometric support on component mount
  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const isSupported = await biometricService.isSupported();
      const hasEnrolled = await biometricService.hasEnrolledBiometrics();
      const isEnabled = await biometricService.isBiometricEnabled();
      
      if (isSupported && hasEnrolled && isEnabled) {
        // Get biometric type for display
        const types = await biometricService.getBiometricTypes();
        const type = types.length > 0 ? types[0] : 'biometric';
        setBiometricType(type);
        setShowBiometric(true);
      }
    } catch (error) {
      console.error('LoginScreen: Error checking biometric support:', error);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      await biometricLogin();
      // Navigation will be handled by useEffect when isAuthenticated changes
    } catch (error: any) {
      Alert.alert('Biometric Login Failed', error.message || 'Unable to authenticate with biometrics');
    }
  };

  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'FINGERPRINT':
        return 'fingerprint';
      case 'FACIAL_RECOGNITION':
        return 'face';
      case 'IRIS':
        return 'eye';
      default:
        return 'fingerprint';
    }
  };

  const getBiometricText = () => {
    switch (biometricType) {
      case 'FINGERPRINT':
        return 'Login with Fingerprint';
      case 'FACIAL_RECOGNITION':
        return 'Login with Face ID';
      case 'IRIS':
        return 'Login with Iris';
      default:
        return 'Login with Biometrics';
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
      // Navigation will be handled by useEffect when isAuthenticated changes
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Invalid credentials';
      Alert.alert('Login Failed', errorMessage);
    }
  };

  // Navigate to home when user is authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('Main'); // Navigate to Main stack
    }
  }, [isAuthenticated, navigation]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <MedicalBackground variant="primary">
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <MedicalHeader 
            title="MedStore" 
            subtitle="Your Digital Pharmacy Partner"
            showIcons={true}
          />

          <Surface style={styles.surface}>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                mode="outlined"
                outlineColor={theme.colors.border.light}
                activeOutlineColor={theme.colorSchemes.primary.main}
                textColor={theme.colors.text.primary}
              />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                  color={theme.colors.text.secondary}
                />
              }
              style={styles.input}
              mode="outlined"
              outlineColor={theme.colors.border.light}
              activeOutlineColor={theme.colorSchemes.primary.main}
              textColor={theme.colors.text.primary}
            />

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              buttonColor={theme.colorSchemes.primary.main}
            >
              Login
            </Button>

            {showBiometric && (
              <View style={styles.biometricContainer}>
                <Button
                  mode="outlined"
                  onPress={handleBiometricLogin}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.biometricButton}
                  contentStyle={styles.biometricButtonContent}
                  labelStyle={styles.biometricButtonLabel}
                  icon={getBiometricIcon()}
                  textColor={theme.colorSchemes.secondary.main}
                >
                  {getBiometricText()}
                </Button>
              </View>
            )}

            <Button
              mode="text"
              onPress={() => navigation.navigate('Register')}
              style={styles.linkButton}
              labelStyle={styles.linkButtonLabel}
              textColor={theme.colorSchemes.secondary.main}
            >
              Don't have an account? Register
            </Button>
          </Surface>
        </ScrollView>
      </MedicalBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  surface: {
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xxl,
    backgroundColor: theme.colors.background.paper,
    ...theme.shadows.xl,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  button: {
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  buttonContent: {
    paddingVertical: theme.spacing.sm,
  },
  buttonLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: theme.spacing.md,
  },
  linkButtonLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    fontSize: theme.typography.fontSize.sm,
  },
  biometricContainer: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  biometricButton: {
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderColor: theme.colorSchemes.secondary.main,
    borderWidth: 1,
  },
  biometricButtonContent: {
    paddingVertical: theme.spacing.sm,
  },
  biometricButtonLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
  },
});