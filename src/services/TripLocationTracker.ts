
import Geolocation from '@react-native-community/geolocation';

export interface LocationSample {
  timestamp: number;
  latitude: number;
  longitude: number;
  speedMetersPerSecond: number | null;
  accuracyMeters: number;
}

export interface LocationTrackingError {
  code: number;
  message: string;
}

export class TripLocationTracker {
  private watchId: number | null = null;

  start(
    onSample: (sample: LocationSample) => void,
    onError: (error: LocationTrackingError) => void,
  ): void {
    if (this.watchId !== null) {
      throw new Error('Location tracking is already active.');
    }

    this.watchId = Geolocation.watchPosition(
      position => {
        onSample({
          timestamp: position.timestamp,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speedMetersPerSecond: position.coords.speed,
          accuracyMeters: position.coords.accuracy,
        });
      },
      error => {
        onError({
          code: error.code,
          message: error.message,
        });
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 5,
        interval: 2000,
        fastestInterval: 1000,
        maximumAge: 0,
        timeout: 20000,
      },
    );
  }

  stop(): void {
    if (this.watchId === null) {
      return;
    }

    Geolocation.clearWatch(this.watchId);
    this.watchId = null;
  }

  isTracking(): boolean {
    return this.watchId !== null;
  }
}
