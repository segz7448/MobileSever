import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator} from 'react-native';
import {supabase} from '../../services/supabase';

const TABS = ['Deployments', 'Logs', 'Env'] as const;
type Tab = typeof TABS[number];

export default function ServerDetailScreen({route}: any) {
  const {server} = route.params;
  const [tab, setTab] = useState<Tab>('Deployments');
  const [deployments, setDeployments] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [envVars, setEnvVars] = useState<any[]>([]);
  const [envKey, setEnvKey] = useState('');
  const [envVal, setEnvVal] = useState('');

  useEffect(() => {
    supabase.from('deployments').select('*').eq('server_id', server.id).order('created_at', {ascending: false})
      .then(({data}) => setDeployments(data || []));
    supabase.from('logs').select('*').eq('server_id', server.id).order('created_at', {ascending: false}).limit(100)
      .then(({data}) => setLogs(data || []));
    supabase.from('env_variables').select('*').eq('server_id', server.id)
      .then(({data}) => setEnvVars(data || []));

    const ch = supabase.channel(`logs-${server.id}`)
      .on('postgres_changes', {event: 'INSERT', schema: 'public', table: 'logs', filter: `server_id=eq.${server.id}`},
        p => setLogs(prev => [p.new, ...prev].slice(0, 200)))
      .subscribe();
    return () => {supabase.removeChannel(ch);};
  }, [server.id]);

  const addEnv = async () => {
    if (!envKey || !envVal) return;
    await supabase.from('env_variables').insert({server_id: server.id, key: envKey, encrypted_value: Buffer.from(envVal).toString('base64')});
    setEnvKey(''); setEnvVal('');
    const {data} = await supabase.from('env_variables').select('*').eq('server_id', server.id);
    setEnvVars(data || []);
  };

  const logColor = (l: string) => l === 'ERROR' ? '#EF4444' : l === 'WARN' ? '#F59E0B' : l === 'INFO' ? '#10B981' : '#6B7280';

  return (
    <View style={s.container}>
      <View style={s.headerBar}>
        <View style={[s.dot, {backgroundColor: server.status === 'running' ? '#10B981' : '#4B5563'}]} />
        <Text style={s.title}>{server.name}</Text>
        <Text style={s.region}>{server.region}</Text>
      </View>
      <View style={s.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabTxt, tab === t && {color: '#fff'}]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {tab === 'Deployments' && (
        <ScrollView style={s.content}>
          {deployments.length === 0 && <Text style={s.empty}>No deployments yet.</Text>}
          {deployments.map(d => (
            <View key={d.id} style={s.item}>
              <Text style={{color: d.status === 'success' ? '#10B981' : '#F59E0B', fontWeight: '700', fontSize: 12}}>{d.status?.toUpperCase()}</Text>
              <Text style={{color: '#9CA3AF', fontSize: 12, marginTop: 4}}>{d.github_repo} @ {d.branch}</Text>
            </View>
          ))}
          <View style={{height: 40}} />
        </ScrollView>
      )}
      {tab === 'Logs' && (
        <ScrollView style={s.terminal}>
          {logs.length === 0 && <Text style={{color: '#4B5563', padding: 16}}>No logs yet.</Text>}
          {logs.map((l, i) => (
            <Text key={i} style={[s.logLine, {color: logColor(l.level)}]}>
              {`[${l.level}] ${new Date(l.created_at).toLocaleTimeString()} — ${l.message}`}
            </Text>
          ))}
        </ScrollView>
      )}
      {tab === 'Env' && (
        <ScrollView style={s.content}>
          <TextInput style={s.input} value={envKey} onChangeText={setEnvKey} placeholder="KEY" placeholderTextColor="#4B5563" autoCapitalize="characters" />
          <TextInput style={s.input} value={envVal} onChangeText={setEnvVal} placeholder="VALUE" placeholderTextColor="#4B5563" secureTextEntry />
          <TouchableOpacity style={s.btn} onPress={addEnv}>
            <Text style={s.btnTxt}>Add Variable</Text>
          </TouchableOpacity>
          {envVars.map(v => (
            <View key={v.id} style={s.item}>
              <Text style={{color: '#3B82F6', fontWeight: '700'}}>{v.key}</Text>
              <Text style={{color: '#4B5563', fontSize: 12}}>••••••••</Text>
            </View>
          ))}
          <View style={{height: 40}} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#080C14'},
  headerBar: {flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, gap: 10},
  dot: {width: 10, height: 10, borderRadius: 5},
  title: {fontSize: 20, fontWeight: '800', color: '#F9FAFB', flex: 1},
  region: {color: '#4B5563', fontSize: 12},
  tabs: {flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#111827', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#1F2937'},
  tab: {flex: 1, padding: 10, alignItems: 'center', borderRadius: 8},
  tabActive: {backgroundColor: '#3B82F6'},
  tabTxt: {color: '#6B7280', fontWeight: '600', fontSize: 13},
  content: {flex: 1, paddingHorizontal: 16},
  terminal: {flex: 1, backgroundColor: '#020408', padding: 12},
  logLine: {fontFamily: 'monospace', fontSize: 11, marginBottom: 4, lineHeight: 18},
  item: {backgroundColor: '#111827', borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#1F2937'},
  input: {backgroundColor: '#1F2937', borderRadius: 10, padding: 14, color: '#F9FAFB', fontSize: 14, borderWidth: 1, borderColor: '#374151', marginBottom: 10},
  btn: {backgroundColor: '#3B82F6', borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 16},
  btnTxt: {color: '#fff', fontWeight: '700'},
  empty: {color: '#4B5563', textAlign: 'center', padding: 40},
});
