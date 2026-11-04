
/**
 * File Name: LoginScreen.tsx
 * Project: Mobile Driver Analytics System
 * Description: Driver login interface with input validation.
 * User Story: US02 / AB#16
 * Task: AB#21 - Build login screen UI
 *
 * @format
 */

import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Validate the inputs before attempting login
  const handleLogin = () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }

    // Basic email format validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');

    // Authentication will be implemented in AB#22
    Alert.alert(
      'Login',
      'Login form validated. Authentication is not connected yet.',
    );
  };

  return (
    <View style={styles.container} testID="login-screen">
      <Text style={styles.title}>Welcome Back</Text>

      <Text style={styles.subtitle}>
        Log in to Mobile Driver Analytics
      </Text>

      {/* Email input */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#9B8C80"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        testID="login-email"
      />

      {/* Password input */}
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        placeholderTextColor="#9B8C80"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        testID="login-password"
      />

      {/* Validation error */}
      {error ? (
        <Text style={styles.errorText} testID="login-error">
          {error}
        </Text>
      ) : null}

      {/* Login button */}
      <Pressable
        style={styles.loginButton}
        onPress={handleLogin}
        accessibilityRole="button"
        testID="login-button"
      >
        <Text style={styles.loginButtonText}>Log In</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
    padding: 24,
    paddingTop: 80,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#3E2C23',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#7A6555',
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3E2C23',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3D9CC',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#3E2C23',
    marginBottom: 20,
  },
  errorText: {
    color: '#C0392B',
    fontSize: 14,
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: '#3E2C23',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;
