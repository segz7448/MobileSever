import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../../services/supabase';
import { getLogs } from '../../services/server';
import { useServerStore } from '../../store/serverStore';
import { Colors } from '../../theme/colors';

const LEVELS = ['ALL', 'INFO', 'WARN', 'ERROR'] as const;

export default function LogsScreen() {
  const { servers, fetchServers } = useServerStore();
  const [selectedServer, setSelectedServer] = useState('');
  const [filter, setFilter] = useState<typeof LEVELS[number]>('ALL');
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => { fetchServers(); }, []);

  useEffect(() => {
    if (servers.length && !selectedServer) setSelectedServer(servers[0].id);
  }, [servers]);

  useEffect(() => {
    if (!selectedServer) return;
    loadLogs();
    const channel = supabase.channel(`logs-screen-${selectedServer}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs', filter: `server_id=eq.${selectedServer}` }, (p) => {
        setLogs((prev) => [p.new, ...prev].slice(0, 500));
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedServer]);

  const loadLogs = async () => {
    try { setLogs(await getLogs(selectedServer, filter === 'ALL' ? undefined : filter)); } catch {}
  };

  useEffect(() => { if (selectedServer) loadLogs(); }, [filter, selectedServer]);

  const logColor = (l: string) => l === 'ERROR' ? Colors.error : l === 'WARN' ? Colors.warning : l === 'INFO' ? Colors.success : Colors.textSecondary;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Logs</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.serverTabs}>
        {servers.map((s) => (
          <TouchableOpacity key={s.id} style={[styles.serverTab, selectedServer === s.id && styles.serverTabActive]} onPress={() => setSelectedServer(s.id)}>
            <Text style={[styles.serverTabText, selectedServer === s.id && { color: '#fff' }]}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.filterRow}>
        {LEVELS.map((l) => (
          <TouchableOpacity key={l} style={[styles.filterBtn, filter === l && styles.filterActive]} onPress={() => setFilter(l)}>
            <Text style={[styles.filterText, filter === l && { color: logColor(l === 'ALL' ? 'INFO' : l) }]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.terminal}>
        <Text style={styles.terminalHeader}>$ tail -f /var/log/server.log</Text>
        {logs.map((l, i) => (
          <Text key={i} style={[styles.logLine, { color: logColor(l.level) }]}>
            <Text style={{ color: Colors.textMuted }}>{new Date(l.created_at).toLocaleTimeString()} </Text>
            <Text style={{ fontWeight: '700' }}>[{l.level}] </Text>
            {l.message}
          </Text>
        ))}
        {logs.length === 0 && <Text style={{ color: Colors.textMuted, marginTop: 16 }}>No logs match this filter.</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, padding: 20, paddingTop: 60, paddingBottom: 12 },
  serverTabs: { paddingHorizontal: 16, marginBottom: 10, maxHeight: 44 },
  serverTab: { backgroundColor: Colors.card, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: Colors.cardBorder },
  serverTabActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  serverTabText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 10, gap: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder },
  filterActive: { backgroundColor: Colors.surface },
  filterText: { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
  terminal: { flex: 1, backgroundColor: '#020408', padding: 14 },
  terminalHeader: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 11, marginBottom: 12 },
  logLine: { fontFamily: 'monospace', fontSize: 11, marginBottom: 3, lineHeight: 18 },
});
