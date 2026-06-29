import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { getServers, updateServerStatus, deleteServer as deleteServerAPI } from '../services/server';

interface Server {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error' | 'deploying';
  region: string;
  ip_address: string | null;
  port: number;
  created_at: string;
  updated_at: string;
}

interface ServerState {
  servers: Server[];
  loading: boolean;
  fetchServers: () => Promise<void>;
  addServer: (server: Server) => void;
  removeServer: (id: string) => void;
  toggleServer: (id: string) => Promise<void>;
  subscribeRealtime: () => () => void;
}

export const useServerStore = create<ServerState>((set, get) => ({
  servers: [],
  loading: false,

  fetchServers: async () => {
    set({ loading: true });
    try {
      const data = await getServers();
      set({ servers: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addServer: (server) => set((s) => ({ servers: [server, ...s.servers] })),

  removeServer: async (id) => {
    await deleteServerAPI(id);
    set((s) => ({ servers: s.servers.filter((sv) => sv.id !== id) }));
  },

  toggleServer: async (id) => {
    const server = get().servers.find((s) => s.id === id);
    if (!server) return;
    const newStatus = server.status === 'running' ? 'stopped' : 'running';
    await updateServerStatus(id, newStatus);
    set((s) => ({
      servers: s.servers.map((sv) => sv.id === id ? { ...sv, status: newStatus as Server['status'] } : sv),
    }));
  },

  subscribeRealtime: () => {
    const channel = supabase
      .channel('servers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servers' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          set((s) => ({ servers: [payload.new as Server, ...s.servers] }));
        } else if (payload.eventType === 'UPDATE') {
          set((s) => ({
            servers: s.servers.map((sv) => sv.id === payload.new.id ? { ...sv, ...payload.new } : sv),
          }));
        } else if (payload.eventType === 'DELETE') {
          set((s) => ({ servers: s.servers.filter((sv) => sv.id !== payload.old.id) }));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  },
}));
