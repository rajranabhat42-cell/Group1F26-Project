
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TripSaveRequest } from './TripPersistenceService';

// Keep pending recordings separate for each authenticated driver.
function getPendingTripKey(driverId: string): string {
  return `pending_trip_${driverId}`;
}

/**
 * Store the completed recording locally before attempting
 * to upload it to Supabase.
 */
export async function storePendingTrip(
  driverId: string,
  trip: TripSaveRequest,
): Promise<void> {
  const key = getPendingTripKey(driverId);

  await AsyncStorage.setItem(key, JSON.stringify(trip));
}

/**
 * Recover an unsaved trip when the driver opens the app again.
 */
export async function loadPendingTrip(
  driverId: string,
): Promise<TripSaveRequest | null> {
  const key = getPendingTripKey(driverId);
  const storedTrip = await AsyncStorage.getItem(key);

  if (!storedTrip) {
    return null;
  }

  const trip: unknown = JSON.parse(storedTrip);

  // Reject invalid stored data instead of uploading it.
  if (
    typeof trip !== 'object' ||
    trip === null ||
    !('tripId' in trip) ||
    typeof trip.tripId !== 'string' ||
    !('startedAt' in trip) ||
    typeof trip.startedAt !== 'number' ||
    !('endedAt' in trip) ||
    typeof trip.endedAt !== 'number' ||
    !('samples' in trip) ||
    !Array.isArray(trip.samples)
  ) {
    throw new Error('Stored trip data is invalid.');
  }

  return trip as TripSaveRequest;
}

/**
 * Remove the locally stored trip after confirming that
 * Supabase saved it successfully.
 *
 * Verify the ID so we do not accidentally remove
 * a different pending trip.
 */
export async function clearPendingTrip(
  driverId: string,
  tripId: string,
): Promise<void> {
  const storedTrip = await loadPendingTrip(driverId);

  if (storedTrip?.tripId !== tripId) {
    return;
  }

  await AsyncStorage.removeItem(getPendingTripKey(driverId));
}
