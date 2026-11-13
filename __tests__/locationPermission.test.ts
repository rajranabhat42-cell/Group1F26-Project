
import { PermissionsAndroid } from 'react-native';
import { requestLocationPermission } from '../src/services/locationPermission';

jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    Version: 35,
  },
  PermissionsAndroid: {
    PERMISSIONS: {
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
      ACCESS_COARSE_LOCATION: 'android.permission.ACCESS_COARSE_LOCATION',
    },
    RESULTS: {
      GRANTED: 'granted',
      DENIED: 'denied',
      NEVER_ASK_AGAIN: 'never_ask_again',
    },
    check: jest.fn(),
    requestMultiple: jest.fn(),
  },
}));

describe('Location Permissions', () => {
  const check = PermissionsAndroid.check as jest.Mock;
  const requestMultiple = PermissionsAndroid.requestMultiple as jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('returns granted when precise location is already allowed', async () => {
    check.mockResolvedValueOnce(true);

    expect(await requestLocationPermission()).toBe('granted');
    expect(requestMultiple).not.toHaveBeenCalled();
  });

  test('detects existing approximate-only permission', async () => {
    check.mockResolvedValueOnce(false);
    check.mockResolvedValueOnce(true);

    expect(await requestLocationPermission()).toBe('approximate-only');
    expect(requestMultiple).not.toHaveBeenCalled();
  });

  test('requests permission when location access is missing', async () => {
    check.mockResolvedValue(false);

    requestMultiple.mockResolvedValue({
      'android.permission.ACCESS_FINE_LOCATION': 'granted',
      'android.permission.ACCESS_COARSE_LOCATION': 'granted',
    });

    expect(await requestLocationPermission()).toBe('granted');
    expect(requestMultiple).toHaveBeenCalledTimes(1);
  });

  test('returns denied when the user refuses permission', async () => {
    check.mockResolvedValue(false);

    requestMultiple.mockResolvedValue({
      'android.permission.ACCESS_FINE_LOCATION': 'denied',
      'android.permission.ACCESS_COARSE_LOCATION': 'denied',
    });

    expect(await requestLocationPermission()).toBe('denied');
  });

  test('returns blocked when permission cannot be requested again', async () => {
    check.mockResolvedValue(false);

    requestMultiple.mockResolvedValue({
      'android.permission.ACCESS_FINE_LOCATION': 'never_ask_again',
      'android.permission.ACCESS_COARSE_LOCATION': 'never_ask_again',
    });

    expect(await requestLocationPermission()).toBe('blocked');
  });

  test('returns unavailable when the permission request fails', async () => {
    check.mockRejectedValue(new Error('Permission service unavailable'));

    expect(await requestLocationPermission()).toBe('unavailable');
  });
});
