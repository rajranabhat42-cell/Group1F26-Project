
import { PermissionsAndroid, Platform } from 'react-native';

export type LocationPermissionStatus =
  | 'granted'
  | 'approximate-only'
  | 'denied'
  | 'blocked'
  | 'unavailable';

export async function requestLocationPermission():
  Promise<LocationPermissionStatus> {

  if (Platform.OS !== 'android') {
    return 'unavailable';
  }

  if (Number(Platform.Version) < 23) {
    return 'granted';
  }

  const fine = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  const coarse = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;

  try {
    // Check whether precise location permission is already granted.
    if (await PermissionsAndroid.check(fine)) {
      return 'granted';
    }

    // Detect when only approximate location permission is available.
    if (await PermissionsAndroid.check(coarse)) {
      return 'approximate-only';
    }

    // Request both location permissions if neither has been granted.
    const results = await PermissionsAndroid.requestMultiple([
      fine,
      coarse,
    ]);

    if (results[fine] === PermissionsAndroid.RESULTS.GRANTED) {
      return 'granted';
    }

    if (results[coarse] === PermissionsAndroid.RESULTS.GRANTED) {
      return 'approximate-only';
    }

    if (
      results[fine] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
      results[coarse] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
    ) {
      return 'blocked';
    }

    return 'denied';
  } catch {
    return 'unavailable';
  }
}
