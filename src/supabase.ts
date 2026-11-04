import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fhjsimgoarkacdzdejym.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_edLsfrrLDA1sLFKxI7uuiA_ZEV6nEVg'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);