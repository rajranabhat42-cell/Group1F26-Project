
import type { LocationSample } from './TripLocationTracker';

export type RecordingStatus = 'idle' | 'recording' | 'stopped';

export interface TripSession {
  startedAt: number;
  endedAt?: number;
}

export interface DrivingSample extends LocationSample {
  accelerationMetersPerSecondSquared: number | null;
}

export class TripRecordingManager {
  private status: RecordingStatus = 'idle';
  private session: TripSession | null = null;
  private samples: DrivingSample[] = [];

  getStatus(): RecordingStatus {
    return this.status;
  }

  getSession(): TripSession | null {
    return this.session ? { ...this.session } : null;
  }

  startTrip(): void {
    if (this.status !== 'idle') {
      throw new Error('A trip is already active or awaiting processing.');
    }

    // Initialize the recording session and its measurements.
    this.samples = [];
    this.session = {
      startedAt: Date.now(),
    };

    this.status = 'recording';
  }

  stopTrip(): void {
    if (this.status !== 'recording' || !this.session) {
      throw new Error('No active trip to stop.');
    }

    this.session.endedAt = Date.now();
    this.status = 'stopped';
  }

  getElapsedTime(): number {
    if (!this.session) {
      return 0;
    }

    const end = this.session.endedAt ?? Date.now();

    return Math.max(0, end - this.session.startedAt);
  }

  recordSample(sample: LocationSample): void {
    if (this.status !== 'recording') {
      throw new Error('Cannot record GPS data without an active trip.');
    }

    const previous = this.samples[this.samples.length - 1];
    let acceleration: number | null = null;

    // Calculate acceleration from consecutive valid GPS readings.
    if (
      previous &&
      previous.speedMetersPerSecond !== null &&
      sample.speedMetersPerSecond !== null &&
      Number.isFinite(previous.speedMetersPerSecond) &&
      Number.isFinite(sample.speedMetersPerSecond) &&
      previous.speedMetersPerSecond >= 0 &&
      sample.speedMetersPerSecond >= 0 &&
      Number.isFinite(previous.timestamp) &&
      Number.isFinite(sample.timestamp) &&
      sample.timestamp > previous.timestamp
    ) {
      const elapsedSeconds =
        (sample.timestamp - previous.timestamp) / 1000;

      acceleration =
        (sample.speedMetersPerSecond -
          previous.speedMetersPerSecond) / elapsedSeconds;
    }

    // Store the GPS reading with its calculated acceleration.
    this.samples.push({
      ...sample,
      accelerationMetersPerSecondSquared: acceleration,
    });
  }

  getSamples(): DrivingSample[] {
    // Prevent callers from modifying stored measurements.
    return this.samples.map(sample => ({ ...sample }));
  }
}
