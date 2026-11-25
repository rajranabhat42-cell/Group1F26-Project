
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

type TripSaveStatus = 'idle' | 'saving' | 'saved' | 'failed';
type SavedRecordingStatus = 'stopped' | 'incomplete';

type ActiveTripScreenProps = {
  elapsedMilliseconds: number;
  status: 'recording' | 'stopped';
  onStopTrip: () => void;
  onRetrySave?: () => void;
  errorMessage?: string | null;
  saveStatus?: TripSaveStatus;
  recordingStatus?: SavedRecordingStatus;
};

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
  onRetrySave,
  errorMessage,
  saveStatus = 'idle',
  recordingStatus = 'stopped',
}: ActiveTripScreenProps) {
  const { width } = useWindowDimensions();

  const isRecording = status === 'recording';
  const isIncomplete = recordingStatus === 'incomplete';

  const isLocationOff = Boolean(
    errorMessage?.startsWith('Android Location is turned off.'),
  );

  const hasGpsWarning =
    isRecording && Boolean(errorMessage);

  const showWarning =
    Boolean(errorMessage) &&
    (isRecording || !isLocationOff);

  const timerFontSize = Math.min(
    68,
    Math.max(40, Math.floor((width - 96) / 4.55)),
  );

  const statusText = isRecording
    ? hasGpsWarning
      ? 'GPS INTERRUPTED'
      : 'RECORDING'
    : saveStatus === 'saving'
      ? 'SAVING'
      : saveStatus === 'saved'
        ? isIncomplete
          ? 'INCOMPLETE'
          : 'SAVED'
        : saveStatus === 'failed'
          ? 'SAVE FAILED'
          : 'STOPPED';

  const saveMessage =
    saveStatus === 'saving'
      ? 'Saving your trip...'
      : saveStatus === 'saved'
        ? isIncomplete
          ? 'Trip saved as incomplete. No score is available.'
          : 'Trip saved. Analysis pending. No score is available until analysis completes.'
        : saveStatus === 'failed'
          ? isIncomplete
            ? 'Trip interrupted. Tap Retry Save.'
            : "Couldn't save your trip. Please try again."
          : 'Trip data has not been saved yet.';

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
        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            {isRecording ? 'ACTIVE TRIP' : 'TRIP ENDED'}
          </Text>

          <Text style={styles.pageTitle}>
            {isRecording
              ? 'Recording'
              : saveStatus === 'saving'
                ? 'Saving trip'
                : saveStatus === 'saved'
                  ? isIncomplete
                    ? 'Trip incomplete'
                    : 'Trip saved'
                  : saveStatus === 'failed'
                    ? 'Save failed'
                    : 'Trip stopped'}
          </Text>
        </View>

        <View style={styles.recordingCard}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                isRecording
                  ? hasGpsWarning
                    ? styles.warningDot
                    : styles.recordingDot
                  : saveStatus === 'saved'
                    ? isIncomplete
                      ? styles.warningDot
                      : styles.recordingDot
                    : saveStatus === 'failed'
                      ? styles.errorDot
                      : saveStatus === 'saving'
                        ? styles.warningDot
                        : styles.stoppedDot,
              ]}
            />

            <Text
              style={[
                styles.statusText,
                isRecording
                  ? hasGpsWarning
                    ? styles.warningText
                    : styles.recordingText
                  : saveStatus === 'saved'
                    ? isIncomplete
                      ? styles.warningText
                      : styles.recordingText
                    : saveStatus === 'failed'
                      ? styles.errorText
                      : saveStatus === 'saving'
                        ? styles.warningText
                        : styles.stoppedText,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              testID="trip-status"
            >
              {statusText}
            </Text>
          </View>

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

          {!isRecording ? (
            <Text
              style={styles.saveNotice}
              testID="trip-save-status"
              accessibilityRole="text"
            >
              {saveMessage}
            </Text>
          ) : null}

          {!isRecording &&
          saveStatus === 'failed' &&
          onRetrySave ? (
            <Pressable
              style={styles.retryButton}
              onPress={onRetrySave}
              accessibilityRole="button"
              accessibilityLabel="Retry Save"
              testID="retry-save-button"
            >
              <Text style={styles.retryButtonText}>
                Retry Save
              </Text>
            </Pressable>
          ) : null}

          {isRecording ? (
            <Pressable
              style={styles.stopButton}
              onPress={onStopTrip}
              accessibilityRole="button"
              accessibilityLabel="Stop Trip"
              testID="stop-trip-button"
            >
              <Text style={styles.stopButtonText}>
                Stop Trip
              </Text>
            </Pressable>
          ) : null}

          {isRecording ? (
            <Text style={styles.safetyText}>
              Only stop when safely parked.
            </Text>
          ) : null}
        </View>

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
  errorDot: {
    backgroundColor: '#DC2626',
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
  errorText: {
    color: '#DC2626',
  },
  timerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    letterSpacing: 1,
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
  stopButtonText: {
    color: '#14233D',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  retryButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#FF6B20',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 20,
  },
  retryButtonText: {
    color: '#14233D',
    fontSize: 18,
    fontWeight: '700',
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
