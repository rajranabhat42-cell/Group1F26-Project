
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

export type LocationAvailability =
  | 'enabled'
  | 'disabled'
  | 'unknown';

export async function checkLocationAvailability():
  Promise<LocationAvailability> {
  if (Platform.OS !== 'android') {
    return 'unknown';
  }

  try {
    // Check whether device-wide location services are enabled.
    const enabled = await DeviceInfo.isLocationEnabled();

    return enabled ? 'enabled' : 'disabled';
  } catch {
    // Do not assume location is disabled when the check fails.
    return 'unknown';
  }
}
