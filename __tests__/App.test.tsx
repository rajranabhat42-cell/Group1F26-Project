
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

// Mock UUID generation so Jest can test the app without loading the package's ES module implementation.
jest.mock('uuid', () => ({
  v4: jest.fn(() => '123e4567-e89b-42d3-a456-426614174000'),
}));

/*
 * Mock AsyncStorage using an in-memory Map.
 * This lets Jest simulate storing and recovering trips.
 */
jest.mock('@react-native-async-storage/async-storage', () => {
  const storage = new Map<string, string>();

  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => {
        return storage.get(key) ?? null;
      }),

      setItem: jest.fn(async (key: string, value: string) => {
        storage.set(key, value);
      }),

      removeItem: jest.fn(async (key: string) => {
        storage.delete(key);
      }),

      clear: jest.fn(async () => {
        storage.clear();
      }),
    },
  };
});

test('renders correctly', async () => {
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<App />);
  });
});
