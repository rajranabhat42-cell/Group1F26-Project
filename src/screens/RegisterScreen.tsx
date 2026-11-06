
/**
 * File Name: RegisterScreen.tsx
 * Project: Mobile Driver Analytics System
 * Author: Raj Bahadur Bhat
 * User Story: US01 / AB#15
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

import { supabase } from '../supabase';
import { validateRegistration } from '../utils/registrationValidation';

type RegisterScreenProps = {
  onRegistered: () => void;
};

function RegisterScreen({ onRegistered }: RegisterScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (loading) return;

    // Validate before sending anything to Supabase.
    const validationError = validateRegistration(
      fullName,
      email,
      password,
    );

    if (validationError) {
      Alert.alert('Invalid Registration', validationError);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        Alert.alert('Registration Failed', error.message);
        return;
      }

      if (!data.user) {
        Alert.alert(
          'Registration Failed',
          'Unable to process your registration.',
        );
        return;
      }

      // Supabase can return an obfuscated result for an
      // existing account. Do not reveal account existence.
      Alert.alert(
        'Registration Request Received',
        'If this email is eligible for registration, ' +
          'a confirmation email will be sent. ' +
          'Please check your inbox before logging in.',
        [
          {
            text: 'Go to Login',
            onPress: onRegistered,
          },
        ],
      );
    } catch {
      Alert.alert(
        'Registration Failed',
        'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>

        <Text style={styles.subtitle}>
          Join Mobile Driver Analytics
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#7A6555"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          testID="register-name"
        />

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#7A6555"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          testID="register-email"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#7A6555"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          testID="register-password"
        />

        <Text style={styles.hint}>
          Minimum 8 characters, including a letter and a number.
        </Text>

        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleRegister}
          disabled={loading}
          accessibilityRole="button"
          testID="register-button"
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating Account...' : 'Register'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F0E8',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E3D9CC',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3E2C23',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#7A6555',
    marginBottom: 24,
  },
  input: {
    height: 50,
    borderColor: '#E3D9CC',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#3E2C23',
    backgroundColor: '#F9F6F0',
  },
  hint: {
    fontSize: 12,
    color: '#7A6555',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#3E2C23',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterScreen;
