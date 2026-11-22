
import { TripRecordingManager } from '../src/services/TripRecordingManager';

describe('TripRecordingManager', () => {
  let manager: TripRecordingManager;

  beforeEach(() => {
    manager = new TripRecordingManager();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('New manager starts in idle state', () => {
    expect(manager.getStatus()).toBe('idle');
    expect(manager.getSession()).toBeNull();
    expect(manager.getElapsedTime()).toBe(0);
  });

  test('Starting a trip changes status to recording', () => {
    manager.startTrip();

    expect(manager.getStatus()).toBe('recording');
    expect(manager.getSession()?.startedAt).toBeDefined();
  });

  test('Cannot start another trip while recording', () => {
    manager.startTrip();

    expect(() => manager.startTrip()).toThrow(
      'A trip is already active or awaiting processing.',
    );
  });

  test('Stopping a trip records the end time', () => {
    manager.startTrip();
    manager.stopTrip();

    expect(manager.getStatus()).toBe('stopped');
    expect(manager.getSession()?.endedAt).toBeDefined();
  });

  test('Cannot stop a trip that has not started', () => {
    expect(() => manager.stopTrip()).toThrow(
      'No active trip to stop.',
    );
  });

  test('Calculates elapsed recording time correctly', () => {
    const now = jest.spyOn(Date, 'now');

    now.mockReturnValue(1000);
    manager.startTrip();

    now.mockReturnValue(6000);

    expect(manager.getElapsedTime()).toBe(5000);

    manager.stopTrip();

    now.mockReturnValue(9000);

    expect(manager.getElapsedTime()).toBe(5000);
  });

  test('Cannot start a new trip while previous trip awaits processing', () => {
    manager.startTrip();
    manager.stopTrip();

    expect(() => manager.startTrip()).toThrow(
      'A trip is already active or awaiting processing.',
    );
  });
});

describe('TripRecordingManager GPS Samples', () => {
  const sample = {
    timestamp: 1000,
    latitude: 43.4516,
    longitude: -80.4925,
    speedMetersPerSecond: 12.5,
    accuracyMeters: 5,
  };

  const expectedSample = {
    ...sample,
    accelerationMetersPerSecondSquared: null,
  };

  test('records GPS samples during an active trip', () => {
    const manager = new TripRecordingManager();

    manager.startTrip();
    manager.recordSample(sample);

    expect(manager.getSamples()).toEqual([expectedSample]);
  });

  test('rejects GPS samples when no trip is active', () => {
    const manager = new TripRecordingManager();

    expect(() => manager.recordSample(sample)).toThrow(
      'Cannot record GPS data without an active trip.',
    );

    manager.startTrip();
    manager.stopTrip();

    expect(() => manager.recordSample(sample)).toThrow(
      'Cannot record GPS data without an active trip.',
    );
  });

  test('preserves the order of recorded samples', () => {
    const manager = new TripRecordingManager();

    const secondSample = {
      ...sample,
      timestamp: 2000,
      latitude: 43.452,
    };

    manager.startTrip();
    manager.recordSample(sample);
    manager.recordSample(secondSample);

    expect(manager.getSamples()).toEqual([
      expectedSample,
      {
        ...secondSample,
        accelerationMetersPerSecondSquared: 0,
      },
    ]);
  });

  test('protects stored samples from external changes', () => {
    const manager = new TripRecordingManager();

    manager.startTrip();
    manager.recordSample(sample);

    const samples = manager.getSamples();
    samples[0].latitude = 0;
    samples.push({ ...expectedSample });

    expect(manager.getSamples()).toEqual([expectedSample]);
  });

  test('does not erase samples when starting a duplicate trip', () => {
    const manager = new TripRecordingManager();

    manager.startTrip();
    manager.recordSample(sample);

    expect(() => manager.startTrip()).toThrow(
      'A trip is already active or awaiting processing.',
    );

    expect(manager.getSamples()).toEqual([expectedSample]);
    expect(manager.getStatus()).toBe('recording');
  });

  test('calculates positive acceleration when speed increases', () => {
    const manager = new TripRecordingManager();

    manager.startTrip();
    manager.recordSample({
      ...sample,
      timestamp: 1000,
      speedMetersPerSecond: 10,
    });
    manager.recordSample({
      ...sample,
      timestamp: 4000,
      speedMetersPerSecond: 16,
    });

    expect(manager.getSamples()[0].accelerationMetersPerSecondSquared).toBeNull();
    expect(manager.getSamples()[1].accelerationMetersPerSecondSquared).toBe(2);
  });

  test('calculates negative acceleration when speed decreases', () => {
    const manager = new TripRecordingManager();

    manager.startTrip();
    manager.recordSample({
      ...sample,
      timestamp: 1000,
      speedMetersPerSecond: 20,
    });
    manager.recordSample({
      ...sample,
      timestamp: 5000,
      speedMetersPerSecond: 8,
    });

    expect(manager.getSamples()[1].accelerationMetersPerSecondSquared).toBe(-3);
  });

  test('calculates zero acceleration when speed remains constant', () => {
    const manager = new TripRecordingManager();

    manager.startTrip();
    manager.recordSample(sample);
    manager.recordSample({
      ...sample,
      timestamp: 3000,
    });

    expect(manager.getSamples()[1].accelerationMetersPerSecondSquared).toBe(0);
  });

  test('handles missing GPS speed measurements', () => {
    const manager = new TripRecordingManager();

    manager.startTrip();
    manager.recordSample(sample);
    manager.recordSample({
      ...sample,
      timestamp: 2000,
      speedMetersPerSecond: null,
    });
    manager.recordSample({
      ...sample,
      timestamp: 3000,
      speedMetersPerSecond: 15,
    });

    expect(manager.getSamples()[1].accelerationMetersPerSecondSquared).toBeNull();
    expect(manager.getSamples()[2].accelerationMetersPerSecondSquared).toBeNull();
  });

  test('rejects invalid timestamp intervals for acceleration', () => {
    const manager = new TripRecordingManager();

    manager.startTrip();
    manager.recordSample(sample);
    manager.recordSample({
      ...sample,
      timestamp: 1000,
      speedMetersPerSecond: 20,
    });

    expect(manager.getSamples()[1].accelerationMetersPerSecondSquared).toBeNull();
  });
});
