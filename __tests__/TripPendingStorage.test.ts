
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  storePendingTrip,
  loadPendingTrip,
  clearPendingTrip,
} from '../src/services/TripPendingStorage';
import type { TripSaveRequest } from '../src/services/TripPersistenceService';

// Simulate phone storage without using a real device.
jest.mock('@react-native-async-storage/async-storage', () => {
  const storage = new Map<string, string>();

  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) =>
        storage.get(key) ?? null
      ),
      setItem: jest.fn(async (key: string, value: string) => {
        storage.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        storage.delete(key);
      }),
      clear: jest.fn(async () => {
        storage.clear();
      }),
    },
  };
});

describe('TripPendingStorage', () => {
  const driverA = 'driver-a';
  const driverB = 'driver-b';

  const trip: TripSaveRequest = {
    tripId: '123e4567-e89b-42d3-a456-426614174000',
    startedAt: 1700000000000,
    endedAt: 1700000060000,
    distanceKm: null,
    timeZone: 'America/Toronto',
    samples: [
      {
        timestamp: 1700000001000,
        latitude: 43.4516,
        longitude: -80.4925,
        speedMetersPerSecond: 10,
        accuracyMeters: 5,
        accelerationMetersPerSecondSquared: null,
      },
    ],
  };

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  test('stores and recovers an unsaved trip', async () => {
    await storePendingTrip(driverA, trip);

    const recovered = await loadPendingTrip(driverA);

    expect(recovered).toEqual(trip);
  });

  test('returns null when no pending trip exists', async () => {
    const recovered = await loadPendingTrip(driverA);

    expect(recovered).toBeNull();
  });

  test('keeps different drivers trips separate', async () => {
    await storePendingTrip(driverA, trip);

    const otherDriverTrip = await loadPendingTrip(driverB);

    expect(otherDriverTrip).toBeNull();
    expect(await loadPendingTrip(driverA)).toEqual(trip);
  });

  test('removes a trip after a successful save', async () => {
    await storePendingTrip(driverA, trip);

    await clearPendingTrip(driverA, trip.tripId);

    expect(await loadPendingTrip(driverA)).toBeNull();
  });

  test('does not delete a different pending trip', async () => {
    await storePendingTrip(driverA, trip);

    await clearPendingTrip(driverA, 'different-trip-id');

    expect(await loadPendingTrip(driverA)).toEqual(trip);
  });

  test('rejects invalid stored trip data', async () => {
    await AsyncStorage.setItem(
      `pending_trip_${driverA}`,
      JSON.stringify({ tripId: 'invalid' }),
    );

    await expect(loadPendingTrip(driverA)).rejects.toThrow(
      'Stored trip data is invalid.',
    );
  });

  test('rejects corrupted JSON data', async () => {
    await AsyncStorage.setItem(
      `pending_trip_${driverA}`,
      '{invalid-json',
    );

    await expect(loadPendingTrip(driverA)).rejects.toThrow();
  });
});
