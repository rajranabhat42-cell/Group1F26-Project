import { supabase } from '../supabase';
import { EventDetectionService } from './EventDetectionService';
import type { DrivingSample } from './TripRecordingManager';

export type ProcessResult =
  | { status: 'no_samples' }
  | { status: 'insufficient_data' }
  | { status: 'no_events' }
  | { status: 'processed'; eventCount: number };

const detector = new EventDetectionService();

export async function processTripEvents(
  tripId: string,
): Promise<ProcessResult> {
  // 1. Get the trip (also gives us the driver id)
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, driver_id')
    .eq('id', tripId)
    .single();

  if (tripError || !trip) {
    throw new Error('Could not load this trip.');
  }

  // 2. Get the saved measurements
  const { data: rows, error: samplesError } = await supabase
    .from('trip_samples')
    .select('*')
    .eq('trip_id', tripId)
    .order('sequence_no', { ascending: true });

  if (samplesError) {
    throw new Error(`Could not load trip data: ${samplesError.message}`);
  }

  if (!rows || rows.length === 0) {
    return { status: 'no_samples' };
  }

  // Need at least 2 points to measure acceleration
  if (rows.length < 2) {
    return { status: 'insufficient_data' };
  }

  // 3. Change database rows into the shape the detector uses
  const samples: DrivingSample[] = rows.map(r => ({
    sequenceNo: r.sequence_no,
    timestamp: new Date(r.recorded_at).getTime(),
    latitude: r.latitude,
    longitude: r.longitude,
    speedMetersPerSecond:
      r.speed_kmh === null ? null : r.speed_kmh / 3.6,
    accuracyMeters: r.accuracy_m,
    accelerationMetersPerSecondSquared: r.acceleration_mps2,
    roadSpeedLimitKmh: r.road_speed_limit_kmh,
    speedLimitSource: r.speed_limit_source,
  }));

  // 4. Find the events
  const events = detector.detectEvents(samples);

  if (events.length === 0) {
    return { status: 'no_events' };
  }

  // 5. Save them. Same trip run again = no duplicates
  const { error: saveError } = await supabase
    .from('driving_events')
    .upsert(
      events.map(e => ({
        trip_id: tripId,
        driver_id: trip.driver_id,
        event_type: e.eventType,
        event_time: new Date(e.timestamp).toISOString(),
        sequence_no: e.sequenceNo,
        latitude: e.latitude,
        longitude: e.longitude,
        measured_value: e.measuredValue,
        unit: e.unit,
        speed_limit_kmh: e.speedLimitKmh,
      })),
      {
        onConflict: 'trip_id,event_type,sequence_no',
        ignoreDuplicates: true,
      },
    );

  if (saveError) {
    throw new Error(`Could not save events: ${saveError.message}`);
  }

  return { status: 'processed', eventCount: events.length };
}