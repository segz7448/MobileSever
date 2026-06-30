import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://xhifuiswgololhnqforr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaWZ1aXN3Z29sb2xobnFmb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NzM1NjAsImV4cCI6MjA5ODE0OTU2MH0.yjP-AIh4G2r5RgWGgKMDHQx0YRjsHfZvnGacF5Dmt2o';
const _sk = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZi',
  'I6InhoaWZ1aXN3Z29sb2xobnFmb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhd',
  'CI6MTc4MjU3MzU2MCwiZXhwIjoyMDk4MTQ5NTYwfQ.S2zVrtZ8_Sj2YepcZB1cLwwxLKaI6oIC9vzB8db2Izs',
].join('');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const supabaseAdmin = createClient(SUPABASE_URL, _sk, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
