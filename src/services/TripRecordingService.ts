
import { requestLocationPermission } from './locationPermission';
import {
  TripLocationTracker,
  type LocationSample,
  type LocationTrackingError,
} from './TripLocationTracker';
import {
  TripRecordingManager,
  type RecordingStatus,
  type TripSession,
} from './TripRecordingManager';

export class TripRecordingService {
  private readonly manager = new TripRecordingManager();
  private readonly tracker = new TripLocationTracker();
  private starting = false;

  async startTrip(
    onError: (error: LocationTrackingError) => void,
  ): Promise<void> {
    if (this.starting || this.manager.getStatus() !== 'idle') {
      throw new Error('A trip is already active or awaiting processing.');
    }

    this.starting = true;

    try {
      const permission = await requestLocationPermission();

      if (permission !== 'granted') {
        throw new Error(
          `Precise location permission is required. Status: ${permission}`,
        );
      }
      
      const pendingSamples: LocationSample[] = [];

      // Preserve location updates received during watcher initialization.
      this.tracker.start(
        sample => {
          if (this.manager.getStatus() === 'recording') {
            this.manager.recordSample(sample);
          } else if (this.starting) {
            pendingSamples.push(sample);
          }
        },

        error => {
          const status = this.manager.getStatus();

          if (status === 'stopped') {
            return;
          }

          // Stop recording when location permission is lost.
          if (error.code === 1 && status === 'recording') {
            this.stopTrip();
          }

          // Notify the caller of the location error.
          onError(error);
        },
      );

      try {
        this.manager.startTrip();

        // Add measurements received before the session became active.
        for (const sample of pendingSamples) {
          this.manager.recordSample(sample);
        }
      } catch (error) {
        this.tracker.stop();
        throw error;
      }

    } finally {
      this.starting = false;
    }
  }

  stopTrip(): void {
    if (this.manager.getStatus() !== 'recording') {
      throw new Error('No active trip to stop.');
    }

    this.manager.stopTrip();
    this.tracker.stop();
  }

  getStatus(): RecordingStatus {
    return this.manager.getStatus();
  }

  getSession(): TripSession | null {
    return this.manager.getSession();
  }

  getSamples(): LocationSample[] {
    return this.manager.getSamples();
  }

  getElapsedTime(): number {
    return this.manager.getElapsedTime();
  }
}
