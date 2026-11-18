
import Geolocation from '@react-native-community/geolocation';
import { requestLocationPermission } from '../src/services/locationPermission';
import { TripRecordingService } from '../src/services/TripRecordingService';

jest.mock('../src/services/locationPermission', () => ({
  requestLocationPermission: jest.fn(),
}));

jest.mock('@react-native-community/geolocation', () => ({
  __esModule: true,
  default: {
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  },
}));

describe('TripRecordingService', () => {
  const requestPermission = requestLocationPermission as jest.Mock;
  const watchPosition = Geolocation.watchPosition as jest.Mock;
  const clearWatch = Geolocation.clearWatch as jest.Mock;

  const sample = {
    timestamp: 1000,
    coords: {
      latitude: 43.4516,
      longitude: -80.4925,
      speed: 12.5,
      accuracy: 5,
    },
  };

  let service: TripRecordingService;
  let onError: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();

    service = new TripRecordingService();
    onError = jest.fn();

    requestPermission.mockResolvedValue('granted');
    watchPosition.mockReturnValue(7);
  });

  test('starts recording when precise location is granted', async () => {
    await service.startTrip(onError);

    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(watchPosition).toHaveBeenCalledTimes(1);
    expect(service.getStatus()).toBe('recording');
    expect(service.getSession()?.startedAt).toBeDefined();
  });

  test('does not record when location permission is denied', async () => {
    requestPermission.mockResolvedValue('denied');

    await expect(service.startTrip(onError)).rejects.toThrow(
      'Precise location permission is required.',
    );

    expect(service.getStatus()).toBe('idle');
    expect(watchPosition).not.toHaveBeenCalled();
  });

  test('stores GPS measurements during recording', async () => {
    await service.startTrip(onError);

    const locationCallback = watchPosition.mock.calls[0][0];

    locationCallback(sample);

    expect(service.getSamples()).toEqual([
      {
        timestamp: 1000,
        latitude: 43.4516,
        longitude: -80.4925,
        speedMetersPerSecond: 12.5,
        accuracyMeters: 5,
        accelerationMetersPerSecondSquared: null,
      },
    ]);
  });

  test('stops GPS tracking and preserves recorded samples', async () => {
    await service.startTrip(onError);

    const locationCallback = watchPosition.mock.calls[0][0];

    locationCallback(sample);

    service.stopTrip();

    expect(service.getStatus()).toBe('stopped');
    expect(service.getSession()?.endedAt).toBeDefined();
    expect(clearWatch).toHaveBeenCalledWith(7);
    expect(service.getSamples()).toHaveLength(1);

    locationCallback(sample);

    expect(service.getSamples()).toHaveLength(1);
  });

  test('forwards GPS errors to the caller', async () => {
    await service.startTrip(onError);

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

  test('prevents starting another trip while recording', async () => {
    await service.startTrip(onError);

    await expect(service.startTrip(onError)).rejects.toThrow(
      'A trip is already active or awaiting processing.',
    );

    expect(watchPosition).toHaveBeenCalledTimes(1);
    expect(service.getStatus()).toBe('recording');
  });

  test('prevents duplicate starts during permission checking', async () => {
    let resolvePermission!: (status: 'granted') => void;

    requestPermission.mockImplementationOnce(
      () => new Promise(resolve => {
        resolvePermission = resolve;
      }),
    );

    const firstStart = service.startTrip(onError);

    await expect(service.startTrip(onError)).rejects.toThrow(
      'A trip is already active or awaiting processing.',
    );

    resolvePermission('granted');
    await firstStart;

    expect(watchPosition).toHaveBeenCalledTimes(1);
    expect(service.getStatus()).toBe('recording');
  });

  test('preserves GPS measurements received during startup', async () => {
    watchPosition.mockImplementationOnce(onPosition => {
      onPosition(sample);
      return 7;
    });

    await service.startTrip(onError);

    expect(service.getStatus()).toBe('recording');
    expect(service.getSamples()).toEqual([
      {
        timestamp: 1000,
        latitude: 43.4516,
        longitude: -80.4925,
        speedMetersPerSecond: 12.5,
        accuracyMeters: 5,
        accelerationMetersPerSecondSquared: null,
      },
    ]);
  });

  test('stops recording when location permission is lost', async () => {
    await service.startTrip(onError);

    const errorCallback = watchPosition.mock.calls[0][1];

    errorCallback({
      code: 1,
      message: 'Location permission denied',
    });

    expect(service.getStatus()).toBe('stopped');
    expect(clearWatch).toHaveBeenCalledWith(7);
    expect(onError).toHaveBeenCalledWith({
      code: 1,
      message: 'Location permission denied',
    });
  });

  test('continues recording when location is unavailable', async () => {
    await service.startTrip(onError);

    const errorCallback = watchPosition.mock.calls[0][1];

    errorCallback({
      code: 2,
      message: 'Location unavailable',
    });

    expect(service.getStatus()).toBe('recording');
    expect(clearWatch).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  test('continues recording after a GPS timeout', async () => {
    await service.startTrip(onError);

    const errorCallback = watchPosition.mock.calls[0][1];

    errorCallback({
      code: 3,
      message: 'Location request timed out',
    });

    expect(service.getStatus()).toBe('recording');
    expect(clearWatch).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  test('ignores GPS errors after recording has stopped', async () => {
    await service.startTrip(onError);

    const errorCallback = watchPosition.mock.calls[0][1];

    service.stopTrip();

    errorCallback({
      code: 2,
      message: 'Location unavailable',
    });

    expect(service.getStatus()).toBe('stopped');
    expect(onError).not.toHaveBeenCalled();
  });


  test('prevents recording when location permission is lost during startup', async () => {
    watchPosition.mockImplementationOnce((_onPosition, onGpsError) => {
      onGpsError({
        code: 1,
        message: 'Location permission denied',
      });

      return 7;
    });

    await expect(service.startTrip(onError)).rejects.toThrow(
      'Location permission lost during trip startup.',
    );

    expect(service.getStatus()).toBe('idle');
    expect(clearWatch).toHaveBeenCalledWith(7);
    expect(onError).toHaveBeenCalledWith({
      code: 1,
      message: 'Location permission denied',
    });
  });

  test('calculates acceleration from incoming GPS updates', async () => {
    await service.startTrip(onError);

    const locationCallback = watchPosition.mock.calls[0][0];

    locationCallback(sample);

    locationCallback({
      ...sample,
      timestamp: 3000,
      coords: {
        ...sample.coords,
        speed: 16.5,
      },
    });

    const samples = service.getSamples();

    expect(samples).toHaveLength(2);
    expect(samples[0].accelerationMetersPerSecondSquared).toBeNull();
    expect(samples[1].accelerationMetersPerSecondSquared).toBe(2);
  });

});
