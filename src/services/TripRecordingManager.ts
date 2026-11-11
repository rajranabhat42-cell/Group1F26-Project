
export type RecordingStatus = 'idle' | 'recording' | 'stopped';

export interface TripSession {
  startedAt: number;
  endedAt?: number;
}

export class TripRecordingManager {
  private status: RecordingStatus = 'idle';
  private session: TripSession | null = null;

  getStatus(): RecordingStatus {
    return this.status;
  }

  getSession(): TripSession | null {
    return this.session ? { ...this.session } : null;
  }

  startTrip(): void {
    if (this.status !== 'idle') {
      throw new Error('A trip is already active or awaiting processing.');
    }

    this.session = {
      startedAt: Date.now(),
    };

    this.status = 'recording';
  }

  stopTrip(): void {
    if (this.status !== 'recording' || !this.session) {
      throw new Error('No active trip to stop.');
    }

    this.session.endedAt = Date.now();
    this.status = 'stopped';
  }

  getElapsedTime(): number {
    if (!this.session) {
      return 0;
    }

    const end = this.session.endedAt ?? Date.now();

    return Math.max(0, end - this.session.startedAt);
  }
}
