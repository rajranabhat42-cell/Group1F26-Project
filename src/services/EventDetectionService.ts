
import type { DrivingSample } from './TripRecordingManager';

export type DrivingEventType =
  | 'speeding'
  | 'harsh_braking'
  | 'rapid_acceleration';

export interface DetectedDrivingEvent {
  eventType: DrivingEventType;
  timestamp: number;
  latitude: number;
  longitude: number;
  measuredValue: number;
  unit: string;
  threshold: number;
}

export class EventDetectionService {
  private readonly SPEEDING_THRESHOLD_KMH = 10;
  private readonly HARSH_BRAKING_THRESHOLD = -3.0;
  private readonly RAPID_ACCELERATION_THRESHOLD = 3.0;

  detectEvents(samples: DrivingSample[]): DetectedDrivingEvent[] {
    const events: DetectedDrivingEvent[] = [];

    for (const sample of samples) {
      // Check for speeding
      if (
        sample.speedMetersPerSecond !== null &&
        Number.isFinite(sample.speedMetersPerSecond) &&
        sample.speedMetersPerSecond >= 0
      ) {
        const speedKmh = sample.speedMetersPerSecond * 3.6;

        // Speeding requires a valid speed limit
        const roadSpeedLimitKmh = (
          sample as DrivingSample & {
            roadSpeedLimitKmh?: number | null;
          }
        ).roadSpeedLimitKmh;

        if (
          roadSpeedLimitKmh !== null &&
          roadSpeedLimitKmh !== undefined &&
          Number.isFinite(roadSpeedLimitKmh) &&
          roadSpeedLimitKmh > 0 &&
          sample.speedMetersPerSecond >
          (roadSpeedLimitKmh + this.SPEEDING_THRESHOLD_KMH) / 3.6
        ) {
          events.push({
            eventType: 'speeding',
            timestamp: sample.timestamp,
            latitude: sample.latitude,
            longitude: sample.longitude,
            measuredValue: speedKmh,
            unit: 'km/h',
            threshold: roadSpeedLimitKmh + this.SPEEDING_THRESHOLD_KMH,
          });
        }
      }

      // Check for harsh braking
      if (
        sample.accelerationMetersPerSecondSquared !== null &&
        Number.isFinite(sample.accelerationMetersPerSecondSquared) &&
        sample.accelerationMetersPerSecondSquared <=
          this.HARSH_BRAKING_THRESHOLD
      ) {
        events.push({
          eventType: 'harsh_braking',
          timestamp: sample.timestamp,
          latitude: sample.latitude,
          longitude: sample.longitude,
          measuredValue: sample.accelerationMetersPerSecondSquared,
          unit: 'm/s²',
          threshold: this.HARSH_BRAKING_THRESHOLD,
        });
      }

      // Check for rapid acceleration
      if (
        sample.accelerationMetersPerSecondSquared !== null &&
        Number.isFinite(sample.accelerationMetersPerSecondSquared) &&
        sample.accelerationMetersPerSecondSquared >=
          this.RAPID_ACCELERATION_THRESHOLD
      ) {
        events.push({
          eventType: 'rapid_acceleration',
          timestamp: sample.timestamp,
          latitude: sample.latitude,
          longitude: sample.longitude,
          measuredValue: sample.accelerationMetersPerSecondSquared,
          unit: 'm/s²',
          threshold: this.RAPID_ACCELERATION_THRESHOLD,
        });
      }
    }

    // Return events in chronological order
    return events.sort((a, b) => a.timestamp - b.timestamp);
  }
}
