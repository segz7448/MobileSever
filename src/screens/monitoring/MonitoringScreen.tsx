import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useServerStore } from '../../store/serverStore';
import { Colors } from '../../theme/colors';

const MetricBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
  <View style={styles.metricRow}>
    <Text style={styles.metricLabel}>{label}</Text>
    <View style={styles.barBg}>
      <View style={[styles.barFill, { width: `${Math.min((value / max) * 100, 100)}%`, backgroundColor: color }]} />
    </View>
    <Text style={[styles.metricVal, { color }]}>{value.toFixed(1)}</Text>
  </View>
);

const fakeMetrics = (serverId: string) => ({
  cpu: Math.random() * 80 + 5,
  ram: Math.random() * 70 + 10,
  network: Math.random() * 100,
  disk: Math.random() * 60 + 20,
});

export default function MonitoringScreen() {
  const { servers, fetchServers } = useServerStore();
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [refreshing, setRefreshing] = useState(false);

  const loadMetrics = useCallback(() => {
    const m: Record<string, any> = {};
    servers.forEach((s) => { m[s.id] = fakeMetrics(s.id); });
    setMetrics(m);
  }, [servers]);

  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    loadMetrics();
    const iv = setInterval(loadMetrics, 5000);
    return () => clearInterval(iv);
  }, [servers]);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchServers(); loadMetrics(); setRefreshing(false); }} tintColor={Colors.accent} />}>
      <Text style={styles.title}>Monitoring</Text>
      <Text style={styles.subtitle}>Live metrics · Updates every 5s</Text>
      {servers.length === 0 && <View style={styles.empty}><ActivityIndicator color={Colors.accent} /></View>}
      {servers.map((s) => {
        const m = metrics[s.id] || {};
        return (
          <View key={s.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.dot, { backgroundColor: s.status === 'running' ? Colors.success : Colors.textMuted }]} />
              <Text style={styles.serverName}>{s.name}</Text>
              <View style={styles.liveBadge}>
                <Text style={styles.liveText}>● LIVE</Text>
              </View>
            </View>
            <MetricBar label="CPU" value={m.cpu || 0} max={100} color={Colors.accent} />
            <MetricBar label="RAM" value={m.ram || 0} max={100} color={Colors.success} />
            <MetricBar label="NET" value={m.network || 0} max={100} color={Colors.warning} />
            <MetricBar label="DSK" value={m.disk || 0} max={100} color="#A78BFA" />
          </View>
        );
      })}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, padding: 20, paddingTop: 60, paddingBottom: 4 },
  subtitle: { fontSize: 12, color: Colors.textMuted, paddingHorizontal: 20, marginBottom: 16 },
  card: { backgroundColor: Colors.card, margin: 16, marginBottom: 8, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.cardBorder },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  serverName: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1 },
  liveBadge: { backgroundColor: '#10B98115', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  liveText: { color: Colors.success, fontSize: 10, fontWeight: '700' },
  metricRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  metricLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', width: 32 },
  barBg: { flex: 1, height: 6, backgroundColor: Colors.surface, borderRadius: 3, marginHorizontal: 10, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  metricVal: { width: 36, fontSize: 11, fontWeight: '700', textAlign: 'right' },
  empty: { padding: 60, alignItems: 'center' },
});
