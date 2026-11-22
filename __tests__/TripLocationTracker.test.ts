
import Geolocation from '@react-native-community/geolocation';
import { TripLocationTracker } from '../src/services/TripLocationTracker';

jest.mock('@react-native-community/geolocation', () => ({
  __esModule: true,
  default: {
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  },
}));

describe('TripLocationTracker', () => {
  const watchPosition = Geolocation.watchPosition as jest.Mock;
  const clearWatch = Geolocation.clearWatch as jest.Mock;

  let tracker: TripLocationTracker;
  let onSample: jest.Mock;
  let onError: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();

    tracker = new TripLocationTracker();
    onSample = jest.fn();
    onError = jest.fn();

    watchPosition.mockReturnValue(7);
  });

  test('starts location tracking', () => {
    tracker.start(onSample, onError);

    expect(tracker.isTracking()).toBe(true);
    expect(watchPosition).toHaveBeenCalledTimes(1);
    expect(watchPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({
        enableHighAccuracy: true,
        distanceFilter: 5,
      }),
    );
  });

  test('converts GPS updates into location samples', () => {
    tracker.start(onSample, onError);

    const locationCallback = watchPosition.mock.calls[0][0];

    locationCallback({
      timestamp: 1000,
      coords: {
        latitude: 43.4516,
        longitude: -80.4925,
        speed: 12.5,
        accuracy: 5,
      },
    });

    expect(onSample).toHaveBeenCalledWith({
      timestamp: 1000,
      latitude: 43.4516,
      longitude: -80.4925,
      speedMetersPerSecond: 12.5,
      accuracyMeters: 5,
    });
  });

  test('preserves unavailable GPS speed as null', () => {
    tracker.start(onSample, onError);

    const locationCallback = watchPosition.mock.calls[0][0];

    locationCallback({
      timestamp: 2000,
      coords: {
        latitude: 43.4516,
        longitude: -80.4925,
        speed: null,
        accuracy: 10,
      },
    });

    expect(onSample).toHaveBeenCalledWith(
      expect.objectContaining({
        speedMetersPerSecond: null,
      }),
    );
  });

  test('prevents starting two location watchers', () => {
    tracker.start(onSample, onError);

    expect(() => tracker.start(onSample, onError)).toThrow(
      'Location tracking is already active.',
    );

    expect(watchPosition).toHaveBeenCalledTimes(1);
  });

  test('stops location tracking and clears the watcher', () => {
    tracker.start(onSample, onError);
    tracker.stop();

    expect(clearWatch).toHaveBeenCalledWith(7);
    expect(tracker.isTracking()).toBe(false);

    tracker.stop();

    expect(clearWatch).toHaveBeenCalledTimes(1);
  });

  test('forwards GPS errors to the caller', () => {
    tracker.start(onSample, onError);

    const errorCallback = watchPosition.mock.calls[0][1];

    errorCallback({
      code: 2,
      message: 'Location unavailable',
    });

    expect(onError).toHaveBeenCalledWith({
      code: 2,
      message: 'Location unavailable',
    });
  });

  test('allows tracking to restart after stopping', () => {
    watchPosition
      .mockReturnValueOnce(7)
      .mockReturnValueOnce(8);

    tracker.start(onSample, onError);
    tracker.stop();
    tracker.start(onSample, onError);

    expect(tracker.isTracking()).toBe(true);
    expect(watchPosition).toHaveBeenCalledTimes(2);
  });
});
