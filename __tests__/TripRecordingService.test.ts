
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
});
