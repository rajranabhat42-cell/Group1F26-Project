
import { supabase } from '../src/supabase';
import {
  saveRecordedTrip,
  type TripSaveRequest,
} from '../src/services/TripPersistenceService';

jest.mock('../src/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

const mockRpc = supabase.rpc as jest.Mock;

describe('TripPersistenceService', () => {
  const trip: TripSaveRequest = {
    tripId: '123e4567-e89b-42d3-a456-426614174000',
    startedAt: 1700000000000,
    endedAt: 1700000060000,
    distanceKm: null,
    timeZone: 'America/Toronto',
    recordingStatus: 'stopped',
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

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('saves a manually stopped trip', async () => {
    mockRpc.mockResolvedValue({
      data: trip.tripId,
      error: null,
    });

    await expect(saveRecordedTrip(trip)).resolves.toBeUndefined();

    expect(mockRpc).toHaveBeenCalledWith(
      'save_recorded_trip_v2',
      {
        p_trip_id: trip.tripId,
        p_started_at: new Date(trip.startedAt).toISOString(),
        p_ended_at: new Date(trip.endedAt).toISOString(),
        p_time_zone: trip.timeZone,
        p_distance_km: trip.distanceKm,
        p_samples: trip.samples,
        p_recording_status: 'stopped',
      },
    );
  });

  test('marks interrupted trips as incomplete', async () => {
    mockRpc.mockResolvedValue({
      data: trip.tripId,
      error: null,
    });

    await saveRecordedTrip({
      ...trip,
      recordingStatus: 'incomplete',
    });

    expect(mockRpc.mock.calls[0][1].p_recording_status)
      .toBe('incomplete');
  });

  test('reports a database error', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Database unavailable' },
    });

    await expect(saveRecordedTrip(trip)).rejects.toThrow(
      'Unable to save trip: Database unavailable',
    );
  });

  test('handles a network failure', async () => {
    mockRpc.mockRejectedValue(new Error('Network request failed'));

    await expect(saveRecordedTrip(trip)).rejects.toThrow(
      'Network request failed',
    );
  });

  test('rejects an incorrect confirmation ID', async () => {
    mockRpc.mockResolvedValue({
      data: 'different-trip-id',
      error: null,
    });

    await expect(saveRecordedTrip(trip)).rejects.toThrow(
      'Trip save could not be confirmed.',
    );
  });

  test('reuses the original UUID on retry', async () => {
    mockRpc.mockResolvedValue({
      data: trip.tripId,
      error: null,
    });

    await saveRecordedTrip(trip);
    await saveRecordedTrip(trip);

    expect(mockRpc).toHaveBeenCalledTimes(2);
    expect(mockRpc.mock.calls[0][1].p_trip_id).toBe(trip.tripId);
    expect(mockRpc.mock.calls[1][1].p_trip_id).toBe(trip.tripId);
  });
});
