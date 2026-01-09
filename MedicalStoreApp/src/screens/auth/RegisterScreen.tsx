import React, { useState } from 'react';
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';

export default function RegisterScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    shopName: '',
    phone: '',
    shopAddress: '',
    gstNumber: '',
    drugLicenseNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const { register, isLoading, error, isAuthenticated } = useAuthStore();

  const handleRegister = async () => {
    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.shopName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        shopName: formData.shopName,
        phone: formData.phone || undefined,
        shopAddress: formData.shopAddress || undefined,
        gstNumber: formData.gstNumber || undefined,
        drugLicenseNumber: formData.drugLicenseNumber || undefined,
      });
      // Navigation will be handled by useEffect when isAuthenticated changes
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Failed to register');
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.surface}>
          <Text variant="headlineLarge" style={styles.title}>
            Create Account
          </Text>
          <Text variant="titleMedium" style={styles.subtitle}>
            Register your medical store
          </Text>

          {/* Personal Information */}
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Personal Information
          </Text>

          <TextInput
            label="Full Name *"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Email *"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Phone Number"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Password *"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry={!showPassword}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Confirm Password *"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
            secureTextEntry={!showPassword}
            style={styles.input}
            mode="outlined"
          />

          {/* Shop Information */}
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Shop Information
          </Text>

          <TextInput
            label="Shop Name *"
            value={formData.shopName}
            onChangeText={(text) => setFormData({ ...formData, shopName: text })}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Shop Address"
            value={formData.shopAddress}
            onChangeText={(text) => setFormData({ ...formData, shopAddress: text })}
            multiline
            numberOfLines={2}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="GST Number"
            value={formData.gstNumber}
            onChangeText={(text) => setFormData({ ...formData, gstNumber: text })}
            autoCapitalize="characters"
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Drug License Number"
            value={formData.drugLicenseNumber}
            onChangeText={(text) => setFormData({ ...formData, drugLicenseNumber: text })}
            style={styles.input}
            mode="outlined"
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
          >
            Register
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            style={styles.linkButton}
          >
            Already have an account? Login
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  surface: {
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
    marginBottom: 30,
    color: '#666',
  },
  sectionTitle: {
    marginTop: 15,
    marginBottom: 10,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    paddingVertical: 8,
  },
  linkButton: {
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});