import React, { useEffect, useRef } from 'react';
import { StatusBar, BackHandler } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { useLogoutConfirmation } from './src/components/LogoutConfirmation';

function AppContent() {
  const { isAuthenticated } = useAuthStore();
  const { showLogoutConfirmation } = useLogoutConfirmation();

  useEffect(() => {
    const handleBackPress = () => {
      if (!isAuthenticated) {
        // User is not logged in, allow normal back behavior
        return false;
      }

      // Show logout confirmation when user presses back button
      showLogoutConfirmation();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, showLogoutConfirmation]);

  return <AppNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <StatusBar barStyle="default" />
          <AppContent />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

