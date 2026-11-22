
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ActiveTripScreenProps = {
  elapsedMilliseconds: number;
  status: 'recording' | 'stopped';
  onStopTrip: () => void;
  errorMessage?: string | null;
};

// Convert elapsed milliseconds into HH:MM:SS.
function formatElapsedTime(milliseconds: number): string {
  const safeMilliseconds = Number.isFinite(milliseconds)
    ? Math.max(0, milliseconds)
    : 0;

  const totalSeconds = Math.floor(safeMilliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map(value => String(value).padStart(2, '0'))
    .join(':');
}

function ActiveTripScreen({
  elapsedMilliseconds,
  status,
  onStopTrip,
  errorMessage,
}: ActiveTripScreenProps) {
  const { width } = useWindowDimensions();

  const isRecording = status === 'recording';

  // Identify the device-wide Location warning.
  const isLocationOff = Boolean(
    errorMessage?.startsWith('Android Location is turned off.'),
  );

  const hasGpsWarning =
    isRecording && Boolean(errorMessage);

  // Do not display an active Location-off warning
  // after the trip has already stopped.
  const showWarning =
    Boolean(errorMessage) &&
    (isRecording || !isLocationOff);

  // Keep the timer readable on different screen widths.
  const timerFontSize = Math.min(
    68,
    Math.max(40, Math.floor((width - 96) / 4.55)),
  );

  // Communicate the recording status using text and color.
  const statusText = !isRecording
    ? 'STOPPED'
    : hasGpsWarning
      ? 'GPS INTERRUPTED'
      : 'RECORDING';

  return (
    <SafeAreaView
      edges={['bottom']}
      style={styles.screen}
      testID="active-trip-screen"
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Page header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            {isRecording ? 'ACTIVE TRIP' : 'TRIP ENDED'}
          </Text>

          <Text style={styles.pageTitle}>
            {isRecording ? 'Recording' : 'Trip stopped'}
          </Text>
        </View>

        {/* Main recording card */}
        <View style={styles.recordingCard}>

          {/* Recording status indicator */}
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                !isRecording
                  ? styles.stoppedDot
                  : hasGpsWarning
                    ? styles.warningDot
                    : styles.recordingDot,
              ]}
            />

            <Text
              style={[
                styles.statusText,
                !isRecording
                  ? styles.stoppedText
                  : hasGpsWarning
                    ? styles.warningText
                    : styles.recordingText,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {statusText}
            </Text>
          </View>

          {/* Elapsed recording timer */}
          <Text style={styles.timerLabel}>
            ELAPSED TIME
          </Text>

          <Text
            style={[
              styles.timer,
              { fontSize: timerFontSize },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            testID="trip-timer"
          >
            {formatElapsedTime(elapsedMilliseconds)}
          </Text>

          {/* Saving is not implemented yet. */}
          {!isRecording ? (
            <Text style={styles.saveNotice}>
              Trip data has not been saved yet.
            </Text>
          ) : null}

          {/* Manual stop control */}
          <Pressable
            style={[
              styles.stopButton,
              !isRecording && styles.disabledButton,
            ]}
            onPress={onStopTrip}
            disabled={!isRecording}
            accessibilityRole="button"
            accessibilityLabel="Stop Trip"
            testID="stop-trip-button"
          >
            <Text style={styles.stopButtonText}>
              Stop Trip
            </Text>
          </Pressable>

          {/* Driver safety reminder */}
          <Text style={styles.safetyText}>
            Only stop when safely parked.
          </Text>
        </View>

        {/* GPS interruption warning */}
        {showWarning ? (
          <View
            style={styles.warningCard}
            testID="trip-warning"
            accessibilityRole="alert"
          >
            <Text style={styles.warningTitle}>
              {isLocationOff
                ? 'Location is off'
                : 'Location Tracking Notice'}
            </Text>

            <Text style={styles.warningDescription}>
              {isLocationOff
                ? 'Enable Location in Settings to resume GPS measurements.'
                : errorMessage}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  scrollView: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
  },

  header: {
    marginBottom: 22,
  },

  eyebrow: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
  },

  pageTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#14233D',
  },

  recordingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 26,
    alignItems: 'center',
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 24,
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },

  recordingDot: {
    backgroundColor: '#15976A',
  },

  warningDot: {
    backgroundColor: '#D97706',
  },

  stoppedDot: {
    backgroundColor: '#64748B',
  },

  statusText: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0.4,
    flexShrink: 1,
  },

  recordingText: {
    color: '#15976A',
  },

  warningText: {
    color: '#B45309',
  },

  stoppedText: {
    color: '#64748B',
  },

  timerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
  },

  timer: {
    color: '#14233D',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    marginBottom: 30,
  },

  saveNotice: {
    fontSize: 16,
    lineHeight: 23,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },

  stopButton: {
    width: '100%',
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: '#FF6B20',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },

  disabledButton: {
    opacity: 0.45,
  },

  stopButtonText: {
    color: '#14233D',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },

  safetyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 18,
  },

  warningCard: {
    backgroundColor: '#FFF2E8',
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
  },

  warningTitle: {
    color: '#14233D',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 6,
  },

  warningDescription: {
    color: '#14233D',
    fontSize: 16,
    lineHeight: 23,
  },
});

export default ActiveTripScreen;
