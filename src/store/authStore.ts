import {create} from 'zustand';
import {supabase} from '../services/supabase';
import type {User, Session} from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  session: null,
  loading: true,

  initialize: async () => {
    try {
      const {data: {session}} = await supabase.auth.getSession();
      set({session, user: session?.user ?? null, loading: false});
      supabase.auth.onAuthStateChange((_event, session) => {
        set({session, user: session?.user ?? null});
      });
    } catch {
      set({loading: false});
    }
  },

  signIn: async (email, password) => {
    const {error} = await supabase.auth.signInWithPassword({email, password});
    if (error) throw error;
  },

  signUp: async (email, password) => {
    const {error} = await supabase.auth.signUp({email, password});
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({user: null, session: null});
  },
}));
