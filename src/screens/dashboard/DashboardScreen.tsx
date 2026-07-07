import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl} from 'react-native';
import {useAuthStore} from '../../store/authStore';
import {supabase} from '../../services/supabase';

export default function DashboardScreen({navigation}: any) {
  const user = useAuthStore(s => s.user);
  const [servers, setServers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const {data} = await supabase.from('servers').select('*').order('created_at', {ascending: false}).limit(10);
      setServers(data || []);
    } catch {}
  };

  useEffect(() => {load();}, []);

  const stats = {
    total: servers.length,
    running: servers.filter(s => s.status === 'running').length,
    stopped: servers.filter(s => s.status === 'stopped').length,
    error: servers.filter(s => s.status === 'error').length,
  };

  return (
    <ScrollView style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing}
        onRefresh={async () => {setRefreshing(true); await load(); setRefreshing(false);}}
        tintColor="#3B82F6" />}>
      <View style={s.header}>
        <Text style={s.greeting}>Welcome back,</Text>
        <Text style={s.name}>{user?.email?.split('@')[0] || 'User'}</Text>
      </View>
      <View style={s.statsRow}>
        {[['Total', stats.total, '#3B82F6'], ['Running', stats.running, '#10B981'],
          ['Stopped', stats.stopped, '#6B7280'], ['Error', stats.error, '#EF4444']].map(([l, v, c]) => (
          <View key={l as string} style={[s.stat, {borderTopColor: c as string}]}>
            <Text style={[s.statVal, {color: c as string}]}>{v as number}</Text>
            <Text style={s.statLbl}>{l as string}</Text>
          </View>
        ))}
      </View>
      <Text style={s.sectionTitle}>Quick Actions</Text>
      <View style={s.grid}>
        {[['🖥', 'Servers', 'Servers'], ['📊', 'Monitor', 'Monitoring'],
          ['📋', 'Logs', 'Logs'], ['🌐', 'Domains', 'Domains'],
          ['🔐', 'Vault', 'Credentials'], ['⚙️', 'Settings', 'Settings']].map(([icon, label, screen]) => (
          <TouchableOpacity key={label} style={s.action} onPress={() => navigation.navigate(screen as string)}>
            <Text style={s.actionIcon}>{icon}</Text>
            <Text style={s.actionLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={s.sectionTitle}>Recent Servers</Text>
      {servers.slice(0, 5).map(sv => (
        <TouchableOpacity key={sv.id} style={s.serverItem}
          onPress={() => navigation.navigate('ServerDetail', {server: sv})}>
          <View style={[s.dot, {backgroundColor: sv.status === 'running' ? '#10B981' : sv.status === 'error' ? '#EF4444' : '#4B5563'}]} />
          <View style={{flex: 1}}>
            <Text style={s.serverName}>{sv.name}</Text>
            <Text style={s.serverRegion}>{sv.region}</Text>
          </View>
          <Text style={{color: '#6B7280', fontSize: 12, textTransform: 'capitalize'}}>{sv.status}</Text>
        </TouchableOpacity>
      ))}
      {servers.length === 0 && <Text style={s.empty}>No servers yet. Create one!</Text>}
      <View style={{height: 40}} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#080C14'},
  header: {padding: 24, paddingTop: 60},
  greeting: {fontSize: 14, color: '#6B7280'},
  name: {fontSize: 26, fontWeight: '800', color: '#F9FAFB', marginTop: 2},
  statsRow: {flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8},
  stat: {flex: 1, backgroundColor: '#111827', borderRadius: 12, padding: 12, alignItems: 'center', borderTopWidth: 3, borderWidth: 1, borderColor: '#1F2937'},
  statVal: {fontSize: 22, fontWeight: '800'},
  statLbl: {fontSize: 10, color: '#6B7280', marginTop: 2},
  sectionTitle: {fontSize: 16, fontWeight: '700', color: '#F9FAFB', paddingHorizontal: 16, marginTop: 16, marginBottom: 12},
  grid: {flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10, marginBottom: 8},
  action: {width: '30%', backgroundColor: '#111827', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1F2937'},
  actionIcon: {fontSize: 24, marginBottom: 6},
  actionLabel: {fontSize: 11, color: '#9CA3AF', fontWeight: '600'},
  serverItem: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#1F2937'},
  dot: {width: 8, height: 8, borderRadius: 4, marginRight: 12},
  serverName: {color: '#F9FAFB', fontWeight: '600', fontSize: 14},
  serverRegion: {color: '#4B5563', fontSize: 12, marginTop: 2},
  empty: {color: '#6B7280', textAlign: 'center', padding: 40},
});
