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
import { ScrollView, StyleSheet, Text, View } from 'react-native';

function DriverDashboard() {
    return (
        // ScrollView lets the screen scroll once more sections or trips are added
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

            {/* Trip History section starts here */}
            <View style={styles.section} testID="trip-history-section">
                <Text style={styles.sectionTitle}>Trip History</Text>
                {/* Empty for now, Step 2 adds the "No trips recorded" message */}
                <View style={styles.sectionBody} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    // Full screen background
    screen: {
        flex: 1,
        backgroundColor: '#F5F0E8',
    },
    // Extra top padding keeps the title clear of the status bar
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
    // Card style for the Trip History section
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
    // Gives the empty section some height so the card doesn't collapse
    sectionBody: {
        minHeight: 80,
    },
});

export default DriverDashboard;