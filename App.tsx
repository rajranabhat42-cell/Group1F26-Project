
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';

import { supabase } from './src/supabase';
import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import DriverDashboard from './src/screens/DriverDashboard';
import ActiveTripScreen from './src/screens/ActiveTripScreen';
import LogoutButton from './src/components/LogoutButton';
import { TripRecordingService } from './src/services/TripRecordingService';
import type { LocationTrackingError } from './src/services/TripLocationTracker';

type TripDisplayStatus = 'idle' | 'recording' | 'stopped';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Maintain one recording service instance.
  const [tripService] = useState(() => new TripRecordingService());

  const [tripStatus, setTripStatus] =
    useState<TripDisplayStatus>('idle');

  const [isStartingTrip, setIsStartingTrip] = useState(false);
  const [elapsedMilliseconds, setElapsedMilliseconds] = useState(0);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    // Restore the existing authentication session.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    }).catch(() => {
      setReady(true);
    });

    // Update the interface when authentication state changes.
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event, newSession) => {
        setSession(newSession);
        setReady(true);

        if (event === 'SIGNED_OUT') {
          setShowRegister(false);

          if (tripService.getStatus() === 'recording') {
            tripService.stopTrip();
            setTripStatus('stopped');
          }
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [tripService]);

  // Refresh the displayed timer while recording.
  useEffect(() => {
    if (tripStatus !== 'recording') {
      return;
    }

    const interval = setInterval(() => {
      setElapsedMilliseconds(tripService.getElapsedTime());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [tripStatus, tripService]);

  const handleGpsError = (error: LocationTrackingError) => {
    setLocationError(error.message);

    // The service automatically stops if GPS permission is lost.
    if (tripService.getStatus() === 'stopped') {
      setElapsedMilliseconds(tripService.getElapsedTime());
      setTripStatus('stopped');
    }
  };

  const handleStartTrip = async () => {
    if (isStartingTrip || tripService.getStatus() !== 'idle') {
      return;
    }

    setIsStartingTrip(true);
    setLocationError(null);

    try {
      // Check permissions and start the GPS watcher.
      await tripService.startTrip(handleGpsError);

      setElapsedMilliseconds(tripService.getElapsedTime());
      setTripStatus('recording');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to start trip recording.';

      Alert.alert('Unable to Start Trip', message);
    } finally {
      setIsStartingTrip(false);
    }
  };

  const handleStopTrip = () => {
    if (tripService.getStatus() !== 'recording') {
      return;
    }

    try {
      // Stop collecting new GPS measurements.
      tripService.stopTrip();

      setElapsedMilliseconds(tripService.getElapsedTime());
      setTripStatus('stopped');
    } catch {
      Alert.alert(
        'Unable to Stop Trip',
        'An error occurred while stopping the recording.',
      );
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView
        style={styles.container}
        edges={['top']}
      >
        {!ready ? (
          <ActivityIndicator size="large" />
        ) : session ? (
          tripStatus !== 'idle' ? (
            <ActiveTripScreen
              elapsedMilliseconds={elapsedMilliseconds}
              status={tripStatus}
              onStopTrip={handleStopTrip}
              errorMessage={locationError}
            />
          ) : (
            <>
              <DriverDashboard
                onStartTrip={handleStartTrip}
                isStartingTrip={isStartingTrip}
              />

              <LogoutButton supabase={supabase} />
            </>
          )
        ) : (
          <>
            {showRegister ? (
              <RegisterScreen
                onRegistered={() => setShowRegister(false)}
              />
            ) : (
              <LoginScreen />
            )}

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
      </SafeAreaView>
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
