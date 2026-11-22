
/**
 * File Name: DriverDashboard.tsx
 * Project: Mobile Driver Analytics System
 * Author: Jacob Fonseca
 * Description: Displays the driver dashboard and Trip History section.
 * User Story: US03 / AB#17
 *
 * @format
 */

import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type DriverDashboardProps = {
  onStartTrip?: () => void;
  isStartingTrip?: boolean;
};

function DriverDashboard({
  onStartTrip,
  isStartingTrip = false,
}: DriverDashboardProps) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID="driver-dashboard"
    >
      {/* Dashboard header */}
      <View style={styles.header}>
        <Text style={styles.title}>Driver Dashboard</Text>
        <Text style={styles.subtitle}>Mobile Driver Analytics</Text>
      </View>

      {/* Start Trip action */}
      <Pressable
        style={[
          styles.startTripButton,
          (!onStartTrip || isStartingTrip) && styles.disabledButton,
        ]}
        onPress={onStartTrip}
        disabled={!onStartTrip || isStartingTrip}
        accessibilityRole="button"
        accessibilityLabel="Start Trip"
        testID="start-trip-button"
      >
        <Text style={styles.startTripButtonText}>
          {isStartingTrip ? 'Starting Trip...' : 'Start Trip'}
        </Text>
      </Pressable>

      {/* Trip History section */}
      <View style={styles.section} testID="trip-history-section">
        <Text style={styles.sectionTitle}>Trip History</Text>

        <View style={styles.sectionBody}>
          <Text style={styles.emptyText} testID="trip-history-empty">
            No trips recorded
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Existing dashboard styles
  screen: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  content: {
    padding: 20,
    paddingTop: 48,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3E2C23',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15,
    color: '#7A6555',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E3D9CC',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3E2C23',
    marginBottom: 12,
  },
  sectionBody: {
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#7A6555',
  },

  // Start Trip button styles
  startTripButton: {
    backgroundColor: '#FF6B20',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  startTripButtonText: {
    color: '#14233D',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default DriverDashboard;
