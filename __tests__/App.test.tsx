
/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

// Mock Supabase to prevent real backend requests.
jest.mock('../src/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
      }),
      onAuthStateChange: jest.fn(() => ({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      })),
      signOut: jest.fn(),
    },
  },
}));

// Mock native GPS functionality for Jest.
jest.mock('@react-native-community/geolocation', () => ({
  __esModule: true,
  default: {
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  },
}));


jest.mock('react-native-device-info', () => ({
  __esModule: true,
  default: {
    isLocationEnabled: jest.fn().mockResolvedValue(true),
  },
}));


test('renders correctly', async () => {
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<App />);
  });
});
