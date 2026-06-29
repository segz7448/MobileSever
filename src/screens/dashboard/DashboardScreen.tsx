import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useServerStore } from '../../store/serverStore';
import { Colors } from '../../theme/colors';

const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <View style={[styles.statCard, { borderTopColor: color }]}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const QuickAction = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress}>
    <Text style={styles.quickIcon}>{icon}</Text>
    <Text style={styles.quickLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function DashboardScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const { servers, fetchServers, loading, subscribeRealtime } = useServerStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchServers();
    const unsub = subscribeRealtime();
    return unsub;
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchServers();
    setRefreshing(false);
  }, []);

  const stats = {
    total: servers.length,
    running: servers.filter((s) => s.status === 'running').length,
    stopped: servers.filter((s) => s.status === 'stopped').length,
    error: servers.filter((s) => s.status === 'error').length,
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting()},</Text>
        <Text style={styles.email}>{user?.email?.split('@')[0] || 'User'}</Text>
        <Text style={styles.subheading}>Here's your cloud overview</Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Total" value={stats.total} color={Colors.accent} />
        <StatCard label="Running" value={stats.running} color={Colors.success} />
        <StatCard label="Stopped" value={stats.stopped} color={Colors.textSecondary} />
        <StatCard label="Error" value={stats.error} color={Colors.error} />
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickGrid}>
        <QuickAction icon="🖥" label="New Server" onPress={() => navigation.navigate('Servers')} />
        <QuickAction icon="📊" label="Monitor" onPress={() => navigation.navigate('Monitoring')} />
        <QuickAction icon="📋" label="Logs" onPress={() => navigation.navigate('Logs')} />
        <QuickAction icon="🔐" label="Credentials" onPress={() => navigation.navigate('Credentials')} />
        <QuickAction icon="🌐" label="Domains" onPress={() => navigation.navigate('Domains')} />
        <QuickAction icon="⚙️" label="Settings" onPress={() => navigation.navigate('Settings')} />
      </View>

      <Text style={styles.sectionTitle}>Recent Servers</Text>
      {loading && !refreshing && <ActivityIndicator color={Colors.accent} style={{ margin: 20 }} />}
      {servers.slice(0, 5).map((s) => (
        <TouchableOpacity key={s.id} style={styles.serverItem} onPress={() => navigation.navigate('ServerDetail', { server: s })}>
          <View style={[styles.statusDot, { backgroundColor: s.status === 'running' ? Colors.success : s.status === 'error' ? Colors.error : Colors.textMuted }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.serverName}>{s.name}</Text>
            <Text style={styles.serverRegion}>{s.region}</Text>
          </View>
          <Text style={[styles.statusText, { color: s.status === 'running' ? Colors.success : s.status === 'error' ? Colors.error : Colors.textSecondary }]}>
            {s.status}
          </Text>
        </TouchableOpacity>
      ))}
      {servers.length === 0 && !loading && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No servers yet. Create your first server!</Text>
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 24, paddingTop: 60 },
  greeting: { fontSize: 14, color: Colors.textSecondary },
  email: { fontSize: 26, fontWeight: '800', color: Colors.text, marginTop: 2 },
  subheading: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 12, padding: 14, alignItems: 'center', borderTopWidth: 3, borderWidth: 1, borderColor: Colors.cardBorder },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, paddingHorizontal: 16, marginTop: 8, marginBottom: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10, marginBottom: 8 },
  quickAction: { width: '30%', backgroundColor: Colors.card, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder },
  quickIcon: { fontSize: 24, marginBottom: 6 },
  quickLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  serverItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  serverName: { color: Colors.text, fontWeight: '600', fontSize: 14 },
  serverRegion: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { color: Colors.textSecondary, textAlign: 'center' },
});
