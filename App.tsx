/**
 * File Name: App.tsx
 * Project: Mobile Driver Analytics System
 *
 * Temporary entry point for testing the login screen.
 * Navigation and authentication will be integrated later.
 *
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './LoginScreen';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <LoginScreen />
    </SafeAreaProvider>
  );
}

export default App;