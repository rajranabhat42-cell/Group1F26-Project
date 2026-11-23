
import { supabase } from '../supabase';
import type { DrivingSample } from './TripRecordingManager';

// Data required to save one completed trip.
export interface TripSaveRequest {
  tripId: string;
  startedAt: number;
  endedAt: number;
  distanceKm: number | null;
  timeZone: string;
  samples: DrivingSample[];
}

/*
 * Saves a completed trip and its GPS measurements
 * using the atomic Supabase database function.
 *
 * The same trip ID must be reused for retries
 * to prevent duplicate trip records.
 */
export async function saveRecordedTrip(
  trip: TripSaveRequest,
): Promise<void> {
  const { data, error } = await supabase.rpc(
    'save_recorded_trip',
    {
      p_trip_id: trip.tripId,
      p_started_at: new Date(trip.startedAt).toISOString(),
      p_ended_at: new Date(trip.endedAt).toISOString(),
      p_time_zone: trip.timeZone,
      p_distance_km: trip.distanceKm,
      p_samples: trip.samples,
    },
  );

  if (error) {
    throw new Error(`Unable to save trip: ${error.message}`);
  }

  // Confirm that the database saved the expected trip.
  if (data !== trip.tripId) {
    throw new Error('Trip save could not be confirmed.');
  }
}
