
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
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
import { v4 as uuidv4 } from 'uuid';

import { supabase } from './src/supabase';
import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import DriverDashboard from './src/screens/DriverDashboard';
import ActiveTripScreen from './src/screens/ActiveTripScreen';
import LogoutButton from './src/components/LogoutButton';
import { TripRecordingService } from './src/services/TripRecordingService';
import type { LocationTrackingError } from './src/services/TripLocationTracker';
import { checkLocationAvailability } from './src/services/locationAvailability';

import {
  saveRecordedTrip,
  type TripSaveRequest,
} from './src/services/TripPersistenceService';

import {
  storePendingTrip,
  loadPendingTrip,
  clearPendingTrip,
} from './src/services/TripPendingStorage';

type TripDisplayStatus = 'idle' | 'recording' | 'stopped';
type TripSaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

const LOCATION_DISABLED_MESSAGE =
  'Android Location is turned off. GPS measurements may be interrupted. ' +
  'Enable Location in Settings to continue collecting driving data.';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Maintain one recording service instance.
  const [tripService] = useState(() => new TripRecordingService());

  // US06: Track the database saving process.
  const [saveStatus, setSaveStatus] =
    useState<TripSaveStatus>('idle');

  // US06: Preserve the original trip and ID for retries.
  const [pendingTrip, setPendingTrip] =
    useState<TripSaveRequest | null>(null);

  // US06: Track which driver's pending trip has been checked.
  const [restoredUserId, setRestoredUserId] =
    useState<string | null>(null);

  const [tripStatus, setTripStatus] =
    useState<TripDisplayStatus>('idle');

  const [isStartingTrip, setIsStartingTrip] = useState(false);
  const [elapsedMilliseconds, setElapsedMilliseconds] = useState(0);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationDisabled, setLocationDisabled] = useState(false);

  useEffect(() => {
    // Restore the existing authentication session.
    supabase.auth.getSession()
      .then(({ data }) => {
        setSession(data.session);
        setReady(true);
      })
      .catch(() => {
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

  // US06: Recover an unsaved trip after restarting the app.
  useEffect(() => {
    const driverId = session?.user.id;

    if (!driverId) {
      setRestoredUserId(null);
      return;
    }

    let cancelled = false;

    const restorePendingTrip = async () => {
      try {
        // Check for a locally stored trip belonging to this driver.
        const storedTrip = await loadPendingTrip(driverId);

        if (cancelled) {
          return;
        }

        // Restore the trip only when no recording is active.
        if (storedTrip && tripService.getStatus() === 'idle') {
          setPendingTrip(storedTrip);

          // Restore the original recording duration.
          setElapsedMilliseconds(
            Math.max(
              0,
              storedTrip.endedAt - storedTrip.startedAt,
            ),
          );

          // Show the stopped screen with a Retry Save button.
          setTripStatus('stopped');
          setSaveStatus('failed');
        }

        setRestoredUserId(driverId);
      } catch (error) {
        if (!cancelled) {
          console.warn('Unable to recover pending trip:', error);

          Alert.alert(
            'Trip Recovery Failed',
            'Unable to read your locally saved trip. ' +
              'Avoid recording another trip until this is resolved.',
          );
        }
      }
    };

    void restorePendingTrip();

    return () => {
      cancelled = true;
    };
  }, [session?.user.id, tripService]);

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

  // Monitor device-wide Location availability during recording.
  useEffect(() => {
    if (tripStatus !== 'recording') {
      return;
    }

    let active = true;
    let checking = false;

    const checkLocation = async () => {
      if (
        !active ||
        checking ||
        AppState.currentState !== 'active'
      ) {
        return;
      }

      checking = true;

      try {
        const availability = await checkLocationAvailability();

        if (!active || tripService.getStatus() !== 'recording') {
          return;
        }

        if (availability === 'disabled') {
          setLocationDisabled(true);
        } else if (availability === 'enabled') {
          setLocationDisabled(false);
        }
      } finally {
        checking = false;
      }
    };

    // Check immediately and periodically while the app is active.
    void checkLocation();

    const interval = setInterval(() => {
      void checkLocation();
    }, 5000);

    // Recheck after returning from Android Settings.
    const subscription = AppState.addEventListener(
      'change',
      nextState => {
        if (nextState === 'active') {
          void checkLocation();
        }
      },
    );

    return () => {
      active = false;
      clearInterval(interval);
      subscription.remove();
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
    setLocationDisabled(false);

    try {
      // Check device-wide Location before starting the GPS watcher.
      const availability = await checkLocationAvailability();

      if (availability === 'disabled') {
        Alert.alert(
          'Location Disabled',
          'Turn on Android Location in Settings before starting a trip.',
        );
        return;
      }

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

  // US06: Stop recording and save the completed trip.
  const handleStopTrip = async () => {
    if (tripService.getStatus() !== 'recording') {
      return;
    }

    try {
      // Stop collecting GPS measurements and freeze the timer.
      tripService.stopTrip();

      setElapsedMilliseconds(tripService.getElapsedTime());
      setTripStatus('stopped');

      // Retrieve the completed recording.
      const tripSession = tripService.getSession();

      if (!tripSession || tripSession.endedAt === undefined) {
        throw new Error('Completed trip information is unavailable.');
      }

      // Generate one unique ID for the completed trip.
      const trip: TripSaveRequest = {
        tripId: uuidv4(),
        startedAt: tripSession.startedAt,
        endedAt: tripSession.endedAt,
        distanceKm: null,
        timeZone:
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        samples: tripService.getSamples(),
      };

      // Retain the trip data for retries while the app is open.
      setPendingTrip(trip);
      setSaveStatus('saving');

      try {
        const driverId = session?.user.id;

        if (!driverId) {
          throw new Error('You must be signed in to save a trip.');
        }

        // Store the completed trip locally before uploading.
        await storePendingTrip(driverId, trip);

        // Upload the trip and measurements to Supabase.
        await saveRecordedTrip(trip);

        // Remove the local copy only after successful saving.
        try {
          await clearPendingTrip(driverId, trip.tripId);
        } catch (cleanupError) {
          console.warn('Unable to clear local trip:', cleanupError);
        }

        // Confirm that Supabase saved the trip.
        setSaveStatus('saved');
        setPendingTrip(null);
      } catch (error) {
        // Keep the trip available for another attempt.
        setSaveStatus('failed');

        Alert.alert(
          'Trip Save Failed',
          error instanceof Error
            ? error.message
            : 'Unable to save the trip.',
        );
      }
    } catch (error) {
      Alert.alert(
        'Unable to Finish Trip',
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred.',
      );
    }
  };

  // US06: Retry a failed save without creating a duplicate trip.
  const handleRetrySave = async () => {
    // Retry only if a failed trip is available.
    if (saveStatus !== 'failed' || !pendingTrip) {
      return;
    }

    // Update the interface while the retry is in progress.
    setSaveStatus('saving');

    try {
      const driverId = session?.user.id;

      if (!driverId) {
        throw new Error('You must be signed in to retry.');
      }

      // Preserve the original recording locally.
      await storePendingTrip(driverId, pendingTrip);

      // Retry with the SAME trip ID to prevent duplicates.
      await saveRecordedTrip(pendingTrip);

      // Remove the local copy after a confirmed save.
      try {
        await clearPendingTrip(driverId, pendingTrip.tripId);
      } catch (cleanupError) {
        console.warn('Unable to clear local trip:', cleanupError);
      }

      setSaveStatus('saved');
      setPendingTrip(null);
    } catch (error) {
      // Keep the original trip available for another retry.
      setSaveStatus('failed');

      Alert.alert(
        'Trip Save Failed',
        error instanceof Error
          ? error.message
          : 'Unable to save the trip. Please try again.',
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
        {!ready || (session && restoredUserId !== session.user.id) ? (
          <ActivityIndicator size="large" />
        ) : session ? (
          tripStatus !== 'idle' ? (
            <ActiveTripScreen
              elapsedMilliseconds={elapsedMilliseconds}
              status={tripStatus}
              onStopTrip={handleStopTrip}
              onRetrySave={handleRetrySave}
              saveStatus={saveStatus}
              errorMessage={
                locationDisabled
                  ? LOCATION_DISABLED_MESSAGE
                  : locationError
              }
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
