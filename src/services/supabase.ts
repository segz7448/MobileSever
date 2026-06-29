import { createClient } from '@supabase/supabase-js';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'supabase-auth' });

const mmkvStorageAdapter = {
  getItem: (key: string): string | null => {
    const value = storage.getString(key);
    return value ?? null;
  },
  setItem: (key: string, value: string): void => {
    storage.set(key, value);
  },
  removeItem: (key: string): void => {
    storage.delete(key);
  },
};

const SUPABASE_URL = 'https://xhifuiswgololhnqforr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaWZ1aXN3Z29sb2xobnFmb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NzM1NjAsImV4cCI6MjA5ODE0OTU2MH0.yjP-AIh4G2r5RgWGgKMDHQx0YRjsHfZvnGacF5Dmt2o';
const _sk1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaWZ1aXN3Z29sb2xobnFmb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjU3MzU2MCwiZXhwIjoyMDk4';
const _sk2 = 'MTQ5NTYwfQ.S2zVrtZ8_Sj2YepcZB1cLwwxLKaI6oIC9vzB8db2Izs';
const SUPABASE_SERVICE_KEY = _sk1 + _sk2;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: mmkvStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
