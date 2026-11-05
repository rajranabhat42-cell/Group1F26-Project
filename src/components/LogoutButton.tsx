
import React, { useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logout } from '../auth/logout';

type LogoutButtonProps = {
  supabase: SupabaseClient;
};

export default function LogoutButton({
  supabase,
}: LogoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;

    setLoading(true);

    try {
      await logout(supabase);
    } catch (error) {
      Alert.alert(
        'Logout failed',
        error instanceof Error
          ? error.message
          : 'Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Log out"
      onPress={handleLogout}
      disabled={loading}
      style={styles.button}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.text}>Log out</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#C62828',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
