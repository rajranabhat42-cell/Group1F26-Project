
import type { LocationSample } from './TripLocationTracker';

export type RecordingStatus = 'idle' | 'recording' | 'stopped';

export interface TripSession {
  startedAt: number;
  endedAt?: number;
}

export class TripRecordingManager {
  private status: RecordingStatus = 'idle';
  private session: TripSession | null = null;
  private samples: LocationSample[] = [];

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

    // Store an independent copy of each GPS measurement.
    this.samples.push({ ...sample });
  }

  getSamples(): LocationSample[] {
    // Prevent callers from modifying the internal sample collection.
    return this.samples.map(sample => ({ ...sample }));
  }
}
