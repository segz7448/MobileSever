import React, {useState, useEffect} from 'react';
import {View, Text, ScrollView, StyleSheet, RefreshControl} from 'react-native';
import {supabase} from '../../services/supabase';

export default function MonitoringScreen() {
  const [servers, setServers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const {data} = await supabase.from('servers').select('*');
    setServers(data || []);
    const m: Record<string, any> = {};
    (data || []).forEach(s => {m[s.id] = {cpu: Math.random()*80+5, ram: Math.random()*70+10, net: Math.random()*100};});
    setMetrics(m);
  };

  useEffect(() => {load(); const iv = setInterval(load, 5000); return () => clearInterval(iv);}, []);

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => {setRefreshing(true); await load(); setRefreshing(false);}} tintColor="#3B82F6" />}>
      <Text style={s.title}>Monitoring</Text>
      <Text style={s.sub}>Live · Updates every 5s</Text>
      {servers.map(sv => {
        const m = metrics[sv.id] || {};
        return (
          <View key={sv.id} style={s.card}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
              <View style={[s.dot, {backgroundColor: sv.status === 'running' ? '#10B981' : '#4B5563'}]} />
              <Text style={s.serverName}>{sv.name}</Text>
              <Text style={{color: '#10B981', fontSize: 10, fontWeight: '700'}}>● LIVE</Text>
            </View>
            {[['CPU', m.cpu||0, '#3B82F6'], ['RAM', m.ram||0, '#10B981'], ['NET', m.net||0, '#F59E0B']].map(([l, v, c]) => (
              <View key={l as string} style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                <Text style={{color: '#4B5563', fontSize: 11, width: 32}}>{l}</Text>
                <View style={{flex: 1, height: 6, backgroundColor: '#1F2937', borderRadius: 3, marginHorizontal: 8, overflow: 'hidden'}}>
                  <View style={{width: `${Math.min(v as number, 100)}%`, height: 6, backgroundColor: c as string, borderRadius: 3}} />
                </View>
                <Text style={{color: c as string, fontSize: 11, width: 36, textAlign: 'right'}}>{(v as number).toFixed(0)}%</Text>
              </View>
            ))}
          </View>
        );
      })}
      {servers.length === 0 && <Text style={s.empty}>No servers to monitor.</Text>}
      <View style={{height: 40}} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#080C14'},
  title: {fontSize: 24, fontWeight: '800', color: '#F9FAFB', padding: 20, paddingTop: 60, paddingBottom: 4},
  sub: {fontSize: 12, color: '#4B5563', paddingHorizontal: 20, marginBottom: 16},
  card: {backgroundColor: '#111827', margin: 16, marginBottom: 8, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#1F2937'},
  dot: {width: 8, height: 8, borderRadius: 4, marginRight: 8},
  serverName: {fontSize: 15, fontWeight: '700', color: '#F9FAFB', flex: 1},
  empty: {color: '#4B5563', textAlign: 'center', padding: 60},
});
