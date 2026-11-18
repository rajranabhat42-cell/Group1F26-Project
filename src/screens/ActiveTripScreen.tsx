
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ActiveTripScreenProps = {
  elapsedMilliseconds: number;
  status: 'recording' | 'stopped';
  onStopTrip: () => void;
  errorMessage?: string | null;
};

function formatElapsedTime(milliseconds: number): string {
  const validMilliseconds = Number.isFinite(milliseconds)
    ? Math.max(0, milliseconds)
    : 0;

  const totalSeconds = Math.floor(validMilliseconds / 1000);
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
  const isRecording = status === 'recording';

  return (
    <View style={styles.screen} testID="active-trip-screen">
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          TRIP IN PROGRESS
        </Text>

        <Text style={styles.pageTitle}>
          {isRecording ? 'Recording' : 'Trip Stopped'}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.introText}>
          Start and stop only when safely parked.
        </Text>

        <View style={styles.recordingCard}>
          <View style={styles.recordingIndicator}>
            <View
              style={[
                styles.statusDot,
                !isRecording && styles.stoppedDot,
              ]}
            />

            <Text
              style={[
                styles.statusLabel,
                !isRecording && styles.stoppedLabel,
              ]}
            >
              {isRecording ? 'RECORDING' : 'STOPPED'}
            </Text>
          </View>

          <Text style={styles.timer} testID="trip-timer">
            {formatElapsedTime(elapsedMilliseconds)}
          </Text>

          <Text style={styles.recordingTitle}>
            {isRecording
              ? 'Recording is active'
              : 'Recording has ended'}
          </Text>

          <Text style={styles.recordingDescription}>
            {isRecording
              ? 'Stop only when safely parked.'
              : 'Trip data has not been saved yet.'}
          </Text>

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
        </View>

        {errorMessage ? (
          <View style={styles.warningCard} testID="trip-warning">
            <Text style={styles.warningTitle}>
              Location Tracking Notice
            </Text>

            <Text style={styles.warningText}>
              {errorMessage}
            </Text>
          </View>
        ) : null}

        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>
            Keep your attention on the road.
          </Text>

          <Text style={styles.safetyDescription}>
            Trip measurements are collected while recording
            is active. No live map or driving statistics
            are shown.
          </Text>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Text style={styles.footerText}>
          MANUAL RECORDING ONLY
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
  },
  eyebrow: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  pageTitle: {
    color: '#14233D',
    fontSize: 30,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  introText: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 16,
  },
  recordingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#15976A',
    marginRight: 8,
  },
  stoppedDot: {
    backgroundColor: '#64748B',
  },
  statusLabel: {
    color: '#15976A',
    fontSize: 12,
    fontWeight: '700',
  },
  stoppedLabel: {
    color: '#64748B',
  },
  timer: {
    color: '#14233D',
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginBottom: 22,
  },
  recordingTitle: {
    color: '#14233D',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  recordingDescription: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  stopButton: {
    backgroundColor: '#FF6B20',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  disabledButton: {
    opacity: 0.5,
  },
  stopButtonText: {
    color: '#14233D',
    fontSize: 15,
    fontWeight: '700',
  },
  safetyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },
  safetyTitle: {
    color: '#14233D',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  safetyDescription: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
  },
  warningCard: {
    backgroundColor: '#FFF2E8',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  warningTitle: {
    color: '#14233D',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  warningText: {
    color: '#14233D',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  footerText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default ActiveTripScreen;
