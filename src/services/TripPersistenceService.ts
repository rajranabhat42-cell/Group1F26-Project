
import { supabase } from '../supabase';
import type { DrivingSample } from './TripRecordingManager';

export type SavedRecordingStatus = 'stopped' | 'incomplete';

// Data required to save one completed or interrupted trip.
export interface TripSaveRequest {
  tripId: string;
  startedAt: number;
  endedAt: number;
  distanceKm: number | null;
  timeZone: string;
  samples: DrivingSample[];
  recordingStatus?: SavedRecordingStatus;
}

/**
 * Save a trip and its GPS measurements atomically.
 * Reuse the original UUID on every retry.
 */
export async function saveRecordedTrip(
  trip: TripSaveRequest,
): Promise<void> {
  const { data, error } = await supabase.rpc(
    'save_recorded_trip_v2',
    {
      p_trip_id: trip.tripId,
      p_started_at: new Date(trip.startedAt).toISOString(),
      p_ended_at: new Date(trip.endedAt).toISOString(),
      p_time_zone: trip.timeZone,
      p_distance_km: trip.distanceKm,
      p_samples: trip.samples,
      p_recording_status: trip.recordingStatus ?? 'stopped',
    },
  );

  if (error) {
    throw new Error(`Unable to save trip: ${error.message}`);
  }

  if (data !== trip.tripId) {
    throw new Error('Trip save could not be confirmed.');
  }
}
