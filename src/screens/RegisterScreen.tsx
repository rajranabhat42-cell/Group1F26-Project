/**
 * File Name: RegisterScreen.tsx
 * Project: Mobile Driver Analytics System
 * Author: Raj Bahadur Bhat
 * Description: Registration screen for new drivers using Supabase Auth and also profile storage.
 * User Story: US01 / AB#15
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../supabase';

function RegisterScreen() {
    // Store the values entered by the user
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);

    // Handle new user registration
    async function handleRegister() {
        // Check if all fields are filled
        if (!email.trim() || !password || !fullName.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            setLoading(true);

            // Create a new user account in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim(),
                password: password,
                options: {
                    data: {
                        full_name: fullName.trim(),
                    },
                },
            });

            // Show an error if registration fails
            if (authError) {
                Alert.alert('Registration Failed', authError.message);
                return;
            }

            // Check if the user account was created
            if (!authData.user) {
                Alert.alert('Registration Failed', 'Unable to create your account.');
                return;
            }

            // Save the user's details in the profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: authData.user.id,
                        email: email.trim(),
                        full_name: fullName.trim(),
                        role: 'Driver'
                    }
                ]);

            // Show an error if saving the profile fails
            if (profileError) {
                Alert.alert('Profile Error', profileError.message);
                return;
            }

            // Show a success message
            Alert.alert('Success', 'Account created! You can now log in.');

        } catch {
            // Handle unexpected errors
            Alert.alert('Error', 'Something went wrong. Please try again.');

        } finally {
            // Stop the loading indicator
            setLoading(false);
        }
    }

    return (
        <View style={styles.screen}>
            <View style={styles.card}>
                {/* Registration title and subtitle */}
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join Mobile Driver Analytics</Text>

                {/* Full name input */}
                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#7A6555"
                    value={fullName}
                    onChangeText={setFullName}
                />

                {/* Email input */}
                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#7A6555"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                {/* Password input */}
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#7A6555"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                {/* Register button */}
                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleRegister}
                    disabled={loading}
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

// Screen styling
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F5F0E8',
        justifyContent: 'center',
        padding: 20
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 24,
        borderWidth: 1,
        borderColor: '#E3D9CC'
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#3E2C23',
        marginBottom: 4
    },
    subtitle: {
        fontSize: 15,
        color: '#7A6555',
        marginBottom: 24
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
        backgroundColor: '#F9F6F0'
    },
    button: {
        backgroundColor: '#3E2C23',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8
    },
    buttonDisabled: {
        opacity: 0.7
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600'
    },
});

export default RegisterScreen;