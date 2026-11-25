
import React, { useEffect, useRef, useState } from 'react';
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
  type SavedRecordingStatus,
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

  // Track the trip saving process.
  const [saveStatus, setSaveStatus] =
    useState<TripSaveStatus>('idle');

  // Preserve unsaved trips for retry.
  const [pendingTrip, setPendingTrip] =
    useState<TripSaveRequest | null>(null);

  // Track which driver's pending trip has been checked.
  const [restoredUserId, setRestoredUserId] =
    useState<string | null>(null);

  const [tripStatus, setTripStatus] =
    useState<TripDisplayStatus>('idle');

  const [completedRecordingStatus, setCompletedRecordingStatus] =
    useState<SavedRecordingStatus>('stopped');

  const [isStartingTrip, setIsStartingTrip] = useState(false);
  const [elapsedMilliseconds, setElapsedMilliseconds] = useState(0);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationDisabled, setLocationDisabled] = useState(false);

  // Keep the same trip ID throughout recording and retries.
  const activeTripIdRef = useRef<string | null>(null);
  const activeTripDriverRef = useRef<string | null>(null);

  // Ensure local backups are written in order.
  const checkpointWritesRef = useRef<Promise<void>>(
    Promise.resolve(),
  );

  // Prevent duplicate finishing operations.
  const finishingTripRef = useRef(false);

  // Keep track of the authenticated driver.
  const signedInDriverRef = useRef<string | null>(null);

  // Reset the current recording interface on account changes.
  const resetTripInterface = () => {
    if (tripService.getStatus() === 'recording') {
      tripService.stopTrip();
    }

    if (tripService.getStatus() === 'stopped') {
      tripService.resetTrip();
    }

    activeTripIdRef.current = null;
    activeTripDriverRef.current = null;

    setTripStatus('idle');
    setSaveStatus('idle');
    setPendingTrip(null);
    setCompletedRecordingStatus('stopped');
    setElapsedMilliseconds(0);
    setLocationError(null);
    setLocationDisabled(false);
    setRestoredUserId(null);
  };

  // Authentication handling.
  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data }) => {
        setSession(data.session);
        setReady(true);
      })
      .catch(error => {
        console.warn('Unable to restore session:', error);
        setReady(true);
      });

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event, newSession) => {
        const newDriverId = newSession?.user.id ?? null;

        if (signedInDriverRef.current !== newDriverId) {
          if (signedInDriverRef.current !== null) {
            // Preserve the old driver's local backup.
            resetTripInterface();
          }

          signedInDriverRef.current = newDriverId;
        }

        setSession(newSession);
        setReady(true);

        if (event === 'SIGNED_OUT') {
          setShowRegister(false);
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [tripService]);

  // Recover a pending or interrupted trip after reopening.
  useEffect(() => {
    const driverId = session?.user.id;

    if (!driverId) {
      setRestoredUserId(null);
      return;
    }

    let cancelled = false;

    const restorePendingTrip = async () => {
      try {
        const storedTrip = await loadPendingTrip(driverId);

        if (cancelled) {
          return;
        }

        if (storedTrip && tripService.getStatus() === 'idle') {
          setPendingTrip(storedTrip);

          setCompletedRecordingStatus(
            storedTrip.recordingStatus ?? 'stopped',
          );

          setElapsedMilliseconds(
            Math.max(
              0,
              storedTrip.endedAt - storedTrip.startedAt,
            ),
          );

          setTripStatus('stopped');
          setSaveStatus('failed');
        }

        setRestoredUserId(driverId);
      } catch (error) {
        if (!cancelled) {
          console.warn('Unable to recover pending trip:', error);

          Alert.alert(
            'Trip Recovery Failed',
            'Unable to recover your recording. ' +
              'Avoid starting another trip until this is resolved.',
          );
        }
      }
    };

    void restorePendingTrip();

    return () => {
      cancelled = true;
    };
  }, [session?.user.id, tripService]);

  // Save an ordered local snapshot during recording.
  const saveRecordingCheckpoint = (
    driverId: string,
  ): Promise<void> => {
    const tripId = activeTripIdRef.current;
    const tripSession = tripService.getSession();

    if (
      !tripId ||
      !tripSession ||
      activeTripDriverRef.current !== driverId
    ) {
      return Promise.resolve();
    }

    const checkpoint: TripSaveRequest = {
      tripId,
      startedAt: tripSession.startedAt,
      endedAt:
        tripSession.endedAt ??
        Math.max(Date.now(), tripSession.startedAt),
      distanceKm: null,
      timeZone:
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      samples: tripService.getSamples(),
      recordingStatus: 'incomplete',
    };

    const nextWrite = checkpointWritesRef.current
      .catch(() => undefined)
      .then(() => storePendingTrip(driverId, checkpoint));

    checkpointWritesRef.current = nextWrite;

    return nextWrite;
  };

  // Refresh the timer during recording.
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

  // Save recording progress locally every two seconds.
  useEffect(() => {
    const driverId = session?.user.id;

    if (tripStatus !== 'recording' || !driverId) {
      return;
    }

    const interval = setInterval(() => {
      if (tripService.getStatus() !== 'recording') {
        return;
      }

      void saveRecordingCheckpoint(driverId).catch(error => {
        console.warn('Recording checkpoint failed:', error);
      });
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [tripStatus, session?.user.id, tripService]);

  // Monitor Android Location availability.
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
      } catch (error) {
        console.warn('Location availability check failed:', error);
      } finally {
        checking = false;
      }
    };

    // Check immediately while recording.
    void checkLocation();

    const interval = setInterval(() => {
      void checkLocation();
    }, 5000);

    // Check again after returning from Android Settings.
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

  /**
   * Save a manually stopped or interrupted trip.
   *
   * Timing logs identify whether slow saving comes from:
   * 1. Waiting for local checkpoints.
   * 2. Writing the final trip to local storage.
   * 3. Uploading the trip to Supabase.
   */
  const finishAndSaveTrip = async (
    recordingStatus: SavedRecordingStatus,
  ) => {
    if (
      finishingTripRef.current ||
      tripService.getStatus() !== 'stopped'
    ) {
      return;
    }

    finishingTripRef.current = true;

    setElapsedMilliseconds(tripService.getElapsedTime());
    setTripStatus('stopped');
    setCompletedRecordingStatus(recordingStatus);
    setSaveStatus('saving');

    // DIAGNOSTIC: Start the total save timer.
    const totalSaveStart = Date.now();

    console.log('[US06] Trip saving started');

    try {
      const driverId = activeTripDriverRef.current;
      const tripId = activeTripIdRef.current;
      const tripSession = tripService.getSession();

      if (
        !driverId ||
        !tripId ||
        !tripSession ||
        tripSession.endedAt === undefined
      ) {
        throw new Error('Completed trip information is unavailable.');
      }

      // Preserve the original recording ID and measurements.
      const trip: TripSaveRequest = {
        tripId,
        startedAt: tripSession.startedAt,
        endedAt: tripSession.endedAt,
        distanceKm: null,
        timeZone:
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        samples: tripService.getSamples(),
        recordingStatus,
      };

      setPendingTrip(trip);

      // DIAGNOSTIC 1: Time spent waiting for local backups.
      let start = Date.now();

      await checkpointWritesRef.current.catch(error => {
        console.warn('Previous checkpoint failed:', error);
      });

      console.log(
        '[US06] Backup wait:',
        Date.now() - start,
        'ms',
      );

      // DIAGNOSTIC 2: Time spent saving the final local copy.
      start = Date.now();

      await storePendingTrip(driverId, trip);

      console.log(
        '[US06] Local storage:',
        Date.now() - start,
        'ms',
      );

      // Stop if the driver account changed during saving.
      if (signedInDriverRef.current !== driverId) {
        throw new Error('Driver session changed during saving.');
      }

      // DIAGNOSTIC 3: Time spent uploading to Supabase.
      start = Date.now();

      console.log('[US06] Supabase upload started');

      await saveRecordedTrip(trip);

      console.log(
        '[US06] Supabase upload:',
        Date.now() - start,
        'ms',
      );

      // Remove the local backup only after a confirmed save.
      try {
        await clearPendingTrip(driverId, trip.tripId);
      } catch (error) {
        console.warn('Unable to clear saved trip backup:', error);
      }

      if (signedInDriverRef.current === driverId) {
        setSaveStatus('saved');
        setPendingTrip(null);
      }
    } catch (error) {
      if (signedInDriverRef.current === activeTripDriverRef.current) {
        setSaveStatus('failed');
      }

      console.warn('[US06] Trip save failed:', error);
    } finally {
      // DIAGNOSTIC 4: Total duration of saving.
      console.log(
        '[US06] Total save time:',
        Date.now() - totalSaveStart,
        'ms',
      );

      finishingTripRef.current = false;
    }
  };

  // Handle GPS errors and interrupted recordings.
  const handleGpsError = (error: LocationTrackingError) => {
    setLocationError(error.message);

    // GPS permission loss automatically stops the service.
    // Save whatever data was collected as an incomplete trip.
    if (tripService.getStatus() === 'stopped') {
      void finishAndSaveTrip('incomplete');
    }
  };

  // Start a new trip.
  const handleStartTrip = async () => {
    const driverId = session?.user.id;

    if (
      !driverId ||
      restoredUserId !== driverId ||
      isStartingTrip ||
      tripService.getStatus() !== 'idle'
    ) {
      return;
    }

    setIsStartingTrip(true);
    setLocationError(null);
    setLocationDisabled(false);

    try {
      // Check device-wide Location availability.
      const availability = await checkLocationAvailability();

      if (availability === 'disabled') {
        Alert.alert(
          'Location Disabled',
          'Turn on Android Location before starting a trip.',
        );
        return;
      }

      // Never overwrite an unsaved recording.
      const existingTrip = await loadPendingTrip(driverId);

      if (existingTrip) {
        Alert.alert(
          'Unsaved Trip',
          'Please save your previous recording first.',
        );

        setPendingTrip(existingTrip);

        setCompletedRecordingStatus(
          existingTrip.recordingStatus ?? 'stopped',
        );

        setElapsedMilliseconds(
          Math.max(
            0,
            existingTrip.endedAt - existingTrip.startedAt,
          ),
        );

        setTripStatus('stopped');
        setSaveStatus('failed');
        return;
      }

      // Assign a stable UUID when recording starts.
      activeTripIdRef.current = uuidv4();
      activeTripDriverRef.current = driverId;

      try {
        await tripService.startTrip(handleGpsError);
      } catch (error) {
        activeTripIdRef.current = null;
        activeTripDriverRef.current = null;
        throw error;
      }

      if (tripService.getStatus() !== 'recording') {
        return;
      }

      // Create an initial local backup.
      try {
        await saveRecordingCheckpoint(driverId);
      } catch (error) {
        if (tripService.getStatus() === 'recording') {
          tripService.stopTrip();
        }

        tripService.resetTrip();

        activeTripIdRef.current = null;
        activeTripDriverRef.current = null;

        throw new Error(
          'Unable to save a recording backup on this device.',
        );
      }

      if (tripService.getStatus() !== 'recording') {
        return;
      }

      setCompletedRecordingStatus('stopped');
      setElapsedMilliseconds(tripService.getElapsedTime());
      setTripStatus('recording');
    } catch (error) {
      console.warn('Unable to start trip:', error);

      Alert.alert(
        'Unable to Start Trip',
        error instanceof Error
          ? error.message
          : 'Unable to start recording.',
      );
    } finally {
      setIsStartingTrip(false);
    }
  };

  // Stop the recording and save automatically.
  const handleStopTrip = () => {
    if (tripService.getStatus() !== 'recording') {
      return;
    }

    tripService.stopTrip();

    void finishAndSaveTrip('stopped');
  };

  // Retry using the original trip UUID and recording status.
  const handleRetrySave = async () => {
    if (saveStatus !== 'failed' || !pendingTrip) {
      return;
    }

    const driverId = session?.user.id;

    if (!driverId || restoredUserId !== driverId) {
      return;
    }

    setSaveStatus('saving');

    // DIAGNOSTIC: Measure retry duration.
    const retryStart = Date.now();

    console.log('[US06] Retry started');

    try {
      // DIAGNOSTIC: Measure local storage.
      let start = Date.now();

      await storePendingTrip(driverId, pendingTrip);

      console.log(
        '[US06] Retry local storage:',
        Date.now() - start,
        'ms',
      );

      // DIAGNOSTIC: Measure Supabase upload.
      start = Date.now();

      await saveRecordedTrip(pendingTrip);

      console.log(
        '[US06] Retry Supabase upload:',
        Date.now() - start,
        'ms',
      );

      // Remove the backup after a confirmed save.
      try {
        await clearPendingTrip(driverId, pendingTrip.tripId);
      } catch (error) {
        console.warn('Unable to clear saved trip backup:', error);
      }

      if (signedInDriverRef.current === driverId) {
        setSaveStatus('saved');
        setPendingTrip(null);
      }
    } catch (error) {
      if (signedInDriverRef.current === driverId) {
        setSaveStatus('failed');
      }

      console.warn('[US06] Trip retry failed:', error);
    } finally {
      console.log(
        '[US06] Total retry time:',
        Date.now() - retryStart,
        'ms',
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
        {!ready ||
        (session && restoredUserId !== session.user.id) ? (
          <ActivityIndicator size="large" />
        ) : session ? (
          tripStatus !== 'idle' ? (
            <ActiveTripScreen
              elapsedMilliseconds={elapsedMilliseconds}
              status={tripStatus}
              onStopTrip={handleStopTrip}
              onRetrySave={handleRetrySave}
              saveStatus={saveStatus}
              recordingStatus={completedRecordingStatus}
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
