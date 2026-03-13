import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/RootNavigator';

function AppContent() {
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

