import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../supabase';
import { processTripEvents } from '../services/DrivingEventService';

type Props = {
  tripId?: string;
  route?: { params?: { tripId?: string } };
};

type EventRow = {
  id: string;
  event_type: 'speeding' | 'harsh_braking' | 'rapid_acceleration';
  event_time: string;
  latitude: number | null;
  longitude: number | null;
  measured_value: number;
  unit: string;
  speed_limit_kmh: number | null;
};

type Message = 'insufficient' | null;

const LABELS = {
  speeding: 'Speeding',
  harsh_braking: 'Harsh braking',
  rapid_acceleration: 'Rapid acceleration',
} as const;

export default function TripEventsScreen({ tripId, route }: Props) {
  const id = tripId ?? route?.params?.tripId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [message, setMessage] = useState<Message>(null);
  const [noSpeedLimit, setNoSpeedLimit] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setError('No trip was selected.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      // 1. Who is logged in?
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        throw new Error('Please log in again.');
      }

      // 2. Make sure this trip belongs to this driver
      const { data: trip } = await supabase
        .from('trips')
        .select('id')
        .eq('id', id)
        .eq('driver_id', user.id)
        .maybeSingle();

      if (!trip) {
        throw new Error('This trip could not be found.');
      }

      // 3. Find and save the events (safe to run again)
      const result = await processTripEvents(id);
      if (
        result.status === 'no_samples' ||
        result.status === 'insufficient_data'
      ) {
        setMessage('insufficient');
        setEvents([]);
        return;
      }

      // 4. Load the saved events, oldest first
      const { data: rows, error: eventsError } = await supabase
        .from('driving_events')
        .select('*')
        .eq('trip_id', id)
        .order('event_time', { ascending: true });

      if (eventsError) {
        throw new Error('Could not load driving events.');
      }
      setEvents((rows ?? []) as EventRow[]);

      // 5. Is there any speed-limit data at all?
      const { count } = await supabase
        .from('trip_samples')
        .select('id', { count: 'exact', head: true })
        .eq('trip_id', id)
        .not('road_speed_limit_kmh', 'is', null);
      setNoSpeedLimit((count ?? 0) === 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const count = (type: EventRow['event_type']) =>
    events.filter(e => e.event_type === type).length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.orange} />
        <Text style={styles.muted}>Loading driving events...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={load}>
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Driving events</Text>

      {message === 'insufficient' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Not enough trip data</Text>
          <Text style={styles.muted}>
            This trip does not have enough measurements to check for events.
          </Text>
        </View>
      )}

      {message === null && (
        <>
          <View style={styles.countRow}>
            {(['speeding', 'harsh_braking', 'rapid_acceleration'] as const).map(
              t => (
                <View key={t} style={styles.countCard}>
                  <Text style={styles.countNumber}>{count(t)}</Text>
                  <Text style={styles.countLabel}>{LABELS[t]}</Text>
                </View>
              ),
            )}
          </View>

          {noSpeedLimit && (
            <View style={styles.warning}>
              <Text style={styles.warningText}>
                Speed-limit data is not available for this trip, so speeding
                could not be checked.
              </Text>
            </View>
          )}

          {events.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>No events detected</Text>
              <Text style={styles.muted}>
                No speeding, harsh braking or rapid acceleration was found on
                this trip.
              </Text>
            </View>
          ) : (
            events.map(e => (
              <View key={e.id} style={styles.card}>
                <Text style={styles.cardTitle}>{LABELS[e.event_type]}</Text>
                <Text style={styles.line}>
                  Time: {new Date(e.event_time).toLocaleTimeString()}
                </Text>
                <Text style={styles.line}>
                  Measured: {e.measured_value.toFixed(1)} {e.unit}
                </Text>
                {e.speed_limit_kmh !== null && (
                  <Text style={styles.line}>
                    Speed limit: {e.speed_limit_kmh} km/h
                  </Text>
                )}
                <Text style={styles.line}>
                  Location:{' '}
                  {e.latitude !== null && e.longitude !== null
                    ? `${e.latitude.toFixed(5)}, ${e.longitude.toFixed(5)}`
                    : 'Not available'}
                </Text>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const COLORS = {
  white: '#FFFFFF',
  background: '#F5F7FA',
  navy: '#14233D',
  orange: '#FF6B20',
  red: '#B3261E',
  yellowBg: '#FFF4D6',
  yellowText: '#7A5B00',
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.navy, marginBottom: 12 },
  countRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  countCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  countNumber: { fontSize: 24, fontWeight: '700', color: COLORS.orange },
  countLabel: { fontSize: 12, color: COLORS.navy, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.navy, marginBottom: 4 },
  line: { fontSize: 14, color: COLORS.navy, marginTop: 2 },
  muted: { fontSize: 14, color: '#5B6678', marginTop: 4 },
  warning: {
    backgroundColor: COLORS.yellowBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  warningText: { color: COLORS.yellowText, fontSize: 14 },
  errorText: { color: COLORS.red, fontSize: 16, textAlign: 'center', marginBottom: 16 },
  button: {
    backgroundColor: COLORS.orange,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});