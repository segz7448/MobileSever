import React, {useState, useEffect} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity} from 'react-native';
import {supabase} from '../../services/supabase';

const LEVELS = ['ALL','INFO','WARN','ERROR'] as const;

export default function LogsScreen() {
  const [servers, setServers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [filter, setFilter] = useState<typeof LEVELS[number]>('ALL');
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('servers').select('id,name').then(({data}) => {
      setServers(data || []);
      if (data && data.length > 0) setSelectedId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let q = supabase.from('logs').select('*').eq('server_id', selectedId).order('created_at', {ascending: false}).limit(200);
    if (filter !== 'ALL') q = q.eq('level', filter);
    q.then(({data}) => setLogs(data || []));
    const ch = supabase.channel(`logs-view-${selectedId}`)
      .on('postgres_changes', {event: 'INSERT', schema: 'public', table: 'logs', filter: `server_id=eq.${selectedId}`},
        p => setLogs(prev => [p.new, ...prev].slice(0, 500)))
      .subscribe();
    return () => {supabase.removeChannel(ch);};
  }, [selectedId, filter]);

  const lc = (l: string) => l === 'ERROR' ? '#EF4444' : l === 'WARN' ? '#F59E0B' : l === 'INFO' ? '#10B981' : '#6B7280';

  return (
    <View style={s.container}>
      <Text style={s.title}>Logs</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{maxHeight: 44, paddingHorizontal: 16, marginBottom: 10}}>
        {servers.map(sv => (
          <TouchableOpacity key={sv.id} style={[s.chip, selectedId === sv.id && s.chipActive]} onPress={() => setSelectedId(sv.id)}>
            <Text style={{color: selectedId === sv.id ? '#fff' : '#6B7280', fontSize: 12, fontWeight: '600'}}>{sv.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={{flexDirection: 'row', paddingHorizontal: 16, marginBottom: 10, gap: 8}}>
        {LEVELS.map(l => (
          <TouchableOpacity key={l} style={[s.fBtn, filter === l && s.fActive]} onPress={() => setFilter(l)}>
            <Text style={{color: filter === l ? lc(l === 'ALL' ? 'INFO' : l) : '#4B5563', fontSize: 12, fontWeight: '700'}}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={s.terminal}>
        <Text style={{color: '#4B5563', fontFamily: 'monospace', fontSize: 11, marginBottom: 12}}>$ tail -f /var/log/server.log</Text>
        {logs.map((l, i) => (
          <Text key={i} style={[s.line, {color: lc(l.level)}]}>
            {`${new Date(l.created_at).toLocaleTimeString()} [${l.level}] ${l.message}`}
          </Text>
        ))}
        {logs.length === 0 && <Text style={{color: '#4B5563'}}>No logs.</Text>}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#080C14'},
  title: {fontSize: 24, fontWeight: '800', color: '#F9FAFB', padding: 20, paddingTop: 60, paddingBottom: 12},
  chip: {backgroundColor: '#111827', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#1F2937'},
  chipActive: {backgroundColor: '#3B82F6', borderColor: '#3B82F6'},
  fBtn: {paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1F2937'},
  fActive: {backgroundColor: '#1F2937'},
  terminal: {flex: 1, backgroundColor: '#020408', padding: 14},
  line: {fontFamily: 'monospace', fontSize: 11, marginBottom: 3, lineHeight: 18},
});
