
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';

import { supabase } from './src/supabase';
import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './LoginScreen';
import DriverDashboard from './DriverDashboard';
import LogoutButton from './src/components/LogoutButton';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    // Check whether the user is already logged in.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    }).catch(() => {
      setReady(true);
    });

    // React whenever the user logs in or out.
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event, newSession) => {
        setSession(newSession);
        setReady(true);

        if (event === 'SIGNED_OUT') {
          setShowRegister(false);
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        {!ready ? (
          <ActivityIndicator size="large" />
        ) : session ? (
          <>
            <DriverDashboard />

            <LogoutButton supabase={supabase} />
          </>
        ) : (
          <>
            {showRegister ? <RegisterScreen /> : <LoginScreen />}

            <Pressable
              style={styles.switchButton}
              onPress={() => setShowRegister(!showRegister)}
              accessibilityRole="button"
            >
              <Text style={styles.switchText}>
                {showRegister
                  ? 'Already have an account? Log In'
                  : "Don't have an account? Register"}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  switchButton: {
    padding: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#3E2C23',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default App;
