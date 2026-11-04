import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fhjjsimgoarkaczdejym.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_edLsfrrLDA1sLFKxI7uuiA_ZEV6nEVg'; 

export const supabase = createClient(
    SUPABASE_URL,
     SUPABASE_ANON_KEY,
    {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

AppState.addEventListener('change', state => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
}
     );