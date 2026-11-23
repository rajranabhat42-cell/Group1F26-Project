
import { EventDetectionService } from '../src/services/EventDetectionService';
import type { DrivingSample } from '../src/services/TripRecordingManager';

describe('EventDetectionService', () => {
  const service = new EventDetectionService();

  const createSample = (
    overrides: Partial<DrivingSample> & {
      roadSpeedLimitKmh?: number | null;
    } = {},
  ): DrivingSample => ({
    timestamp: 1000,
    latitude: 43.5,
    longitude: -80.2,
    speedMetersPerSecond: 20,
    accuracyMeters: 5,
    accelerationMetersPerSecondSquared: 0,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('detects speeding when more than 10 km/h above the speed limit', () => {
    const sample = createSample({
      speedMetersPerSecond: 30 / 3.6,
      roadSpeedLimitKmh: 20,
    });

    const events = service.detectEvents([sample]);

    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('speeding');
  });

  test('does not detect speeding at exactly 10 km/h above the limit', () => {
    const sample = createSample({
      speedMetersPerSecond: 30 / 3.6,
      roadSpeedLimitKmh: 20,
    });

    const events = service.detectEvents([sample]);

    expect(events).toHaveLength(0);
  });

  test('detects harsh braking at -3.0 m/s²', () => {
    const sample = createSample({
      accelerationMetersPerSecondSquared: -3.0,
    });

    const events = service.detectEvents([sample]);

    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('harsh_braking');
  });

  test('detects rapid acceleration at +3.0 m/s²', () => {
    const sample = createSample({
      accelerationMetersPerSecondSquared: 3.0,
    });

    const events = service.detectEvents([sample]);

    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('rapid_acceleration');
  });

  test('does not detect speeding when speed limit is missing', () => {
    const sample = createSample({
      speedMetersPerSecond: 40,
    });

    const events = service.detectEvents([sample]);

    expect(events.some(event => event.eventType === 'speeding')).toBe(false);
  });

  test('returns events in chronological order', () => {
    const samples = [
      createSample({
        timestamp: 3000,
        accelerationMetersPerSecondSquared: 3.5,
      }),
      createSample({
        timestamp: 1000,
        accelerationMetersPerSecondSquared: -3.5,
      }),
    ];

    const events = service.detectEvents(samples);

    expect(events[0].timestamp).toBe(1000);
    expect(events[1].timestamp).toBe(3000);
  });
});
