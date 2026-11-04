
/**
 * File Name: LoginScreen.tsx
 * Project: Mobile Driver Analytics System
 * Description: Driver login interface with input validation.
 * User Story: US02 / AB#16
 * Task: AB#21, AB#22
 *
 * @format
 */

import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { supabase } from './src/supabase';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Validate the inputs before attempting login
  
const handleLogin = async () => {
  const trimmedEmail = email.trim();

  // Check for empty fields
  if (!trimmedEmail || !password) {
    setError('Please enter your email and password.');
    return;
  }

  // Validate email format
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(trimmedEmail)) {
    setError('Please enter a valid email address.');
    return;
  }

  setError('');
  setLoading(true);

  try {
    // Authenticate using Supabase
    const { error: authError } =
      await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password,
      });

    if (authError) {
      setError(authError.message);
      return;
    }

    // Successful login will be handled by App.tsx
    // when it detects the authenticated session.

  } catch {
    setError('Unable to log in. Please try again.');
  } finally {
    setLoading(false);
  }
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
        disabled={loading}
        accessibilityRole="button"
        testID="login-button"
      >
        <Text style={styles.loginButtonText}>
          {loading ? 'Logging in...' : 'Log In'}
        </Text>
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
