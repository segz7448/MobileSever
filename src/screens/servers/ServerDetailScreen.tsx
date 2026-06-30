import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { supabase } from '../../services/supabase';
import { listRepos, getLatestCommit, getWorkerScript } from '../../services/github';
import { deployWorker, generateWorkerScript } from '../../services/cloudflare';
import { createDeployment, getDeployments, getLogs } from '../../services/server';
import { Colors } from '../../theme/colors';

const TABS = ['Deployments', 'Logs', 'Env'] as const;
type Tab = typeof TABS[number];

export default function ServerDetailScreen({ route }: any) {
  const { server } = route.params;
  const [tab, setTab] = useState<Tab>('Deployments');
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [deploying, setDeploying] = useState(false);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [workerUrl, setWorkerUrl] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [envKey, setEnvKey] = useState('');
  const [envVal, setEnvVal] = useState('');
  const [envVars, setEnvVars] = useState<any[]>([]);

  useEffect(() => {
    loadAll();
    const channel = supabase
      .channel(`logs-${server.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'logs',
        filter: `server_id=eq.${server.id}`,
      }, (payload) => {
        setLogs((prev) => [payload.new, ...prev].slice(0, 200));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadAll = async () => {
    try { setRepos(await listRepos()); } catch {}
    try { setDeployments(await getDeployments(server.id)); } catch {}
    try { setLogs(await getLogs(server.id)); } catch {}
    try {
      const { data } = await supabase.from('env_variables').select('*').eq('server_id', server.id);
      setEnvVars(data || []);
    } catch {}
  };

  const handleDeploy = async () => {
    if (!selectedRepo) { Alert.alert('Error', 'Select a GitHub repo'); return; }
    setDeploying(true);
    try {
      let script = await getWorkerScript(selectedRepo, branch);
      if (!script) script = generateWorkerScript(server.name);
      const commit = await getLatestCommit(selectedRepo, branch);
      const result = await deployWorker(server.name, script);
      setWorkerUrl(result.url);
      await createDeployment(server.id, selectedRepo, branch, commit.sha, result.url);
      await loadAll();
      Alert.alert('Deployed!', `Worker live at:\n${result.url}`);
    } catch (e: any) {
      Alert.alert('Deploy Failed', e.message);
    } finally {
      setDeploying(false);
    }
  };

  const addEnvVar = async () => {
    if (!envKey || !envVal) return;
    // Use Buffer for base64 encoding (Hermes built-in, no atob/btoa needed)
    const encoded = Buffer.from(envVal, 'utf8').toString('base64');
    await supabase.from('env_variables').insert({
      server_id: server.id,
      key: envKey,
      encrypted_value: encoded,
    });
    setEnvKey(''); setEnvVal('');
    const { data } = await supabase.from('env_variables').select('*').eq('server_id', server.id);
    setEnvVars(data || []);
  };

  const logColor = (level: string) =>
    level === 'ERROR' ? Colors.error :
    level === 'WARN'  ? Colors.warning :
    level === 'INFO'  ? Colors.success : Colors.textSecondary;

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <View style={[styles.dot, { backgroundColor: server.status === 'running' ? Colors.success : Colors.textMuted }]} />
        <Text style={styles.title}>{server.name}</Text>
        <Text style={styles.region}>{server.region}</Text>
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'Deployments' && (
        <ScrollView style={styles.content}>
          {workerUrl ? (
            <View style={styles.workerBanner}>
              <Text style={styles.workerLabel}>🌐 Live Worker URL</Text>
              <Text style={styles.workerUrl}>{workerUrl}</Text>
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>GitHub Repository</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {repos.map((r) => (
              <TouchableOpacity
                key={r.fullName}
                style={[styles.chip, selectedRepo === r.fullName && styles.chipActive]}
                onPress={() => setSelectedRepo(r.fullName)}>
                <Text style={[styles.chipText, selectedRepo === r.fullName && { color: '#fff' }]}>{r.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionLabel}>Branch</Text>
          <TextInput
            style={styles.input}
            value={branch}
            onChangeText={setBranch}
            placeholder="main"
            placeholderTextColor={Colors.textMuted}
          />

          <TouchableOpacity
            style={[styles.deployBtn, deploying && { opacity: 0.6 }]}
            onPress={handleDeploy}
            disabled={deploying}>
            {deploying
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.deployBtnText}>🚀 Deploy to Cloudflare</Text>}
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>History</Text>
          {deployments.map((d) => (
            <View key={d.id} style={styles.histItem}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: d.status === 'deploying' ? Colors.warning : Colors.success, fontWeight: '700', fontSize: 12 }}>
                  {d.status.toUpperCase()}
                </Text>
                <Text style={{ color: Colors.textMuted, fontSize: 11 }}>
                  {new Date(d.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={{ color: Colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                {d.github_repo} @ {d.branch}
              </Text>
              {d.build_logs ? (
                <Text style={{ color: Colors.accent, fontSize: 11, marginTop: 2 }}>{d.build_logs}</Text>
              ) : null}
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {tab === 'Logs' && (
        <ScrollView style={styles.terminal}>
          {logs.map((l, i) => (
            <Text key={i} style={[styles.logLine, { color: logColor(l.level) }]}>
              <Text style={{ color: Colors.textMuted }}>{new Date(l.created_at).toLocaleTimeString()} </Text>
              <Text style={{ fontWeight: '700' }}>[{l.level}] </Text>
              {l.message}
            </Text>
          ))}
          {logs.length === 0 && (
            <Text style={{ color: Colors.textMuted, padding: 20 }}>No logs yet. Logs stream here in real time.</Text>
          )}
        </ScrollView>
      )}

      {tab === 'Env' && (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionLabel}>Add Variable</Text>
          <TextInput
            style={styles.input}
            value={envKey}
            onChangeText={setEnvKey}
            placeholder="KEY"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="characters"
          />
          <TextInput
            style={styles.input}
            value={envVal}
            onChangeText={setEnvVal}
            placeholder="VALUE"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
          />
          <TouchableOpacity style={styles.deployBtn} onPress={addEnvVar}>
            <Text style={styles.deployBtnText}>Add Variable</Text>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>Variables</Text>
          {envVars.map((v) => (
            <View key={v.id} style={styles.envItem}>
              <Text style={{ color: Colors.accent, fontWeight: '700', fontSize: 13 }}>{v.key}</Text>
              <Text style={{ color: Colors.textMuted, fontSize: 12 }}>••••••••</Text>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBar: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text, flex: 1 },
  region: { color: Colors.textMuted, fontSize: 12 },
  tabs: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 12,
    backgroundColor: Colors.card, borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  tab: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: Colors.accent },
  tabText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#fff' },
  content: { flex: 1, paddingHorizontal: 16 },
  sectionLabel: {
    color: Colors.textSecondary, fontSize: 12, fontWeight: '700',
    marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 1,
  },
  chip: {
    backgroundColor: Colors.surface, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  input: {
    backgroundColor: Colors.surface, borderRadius: 10, padding: 14,
    color: Colors.text, fontSize: 14, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 10,
  },
  deployBtn: { backgroundColor: Colors.accent, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 8, marginBottom: 4 },
  deployBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  histItem: {
    backgroundColor: Colors.card, borderRadius: 10, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  terminal: { flex: 1, backgroundColor: '#030712', padding: 12 },
  logLine: { fontFamily: 'monospace', fontSize: 11, marginBottom: 4, lineHeight: 18 },
  workerBanner: {
    backgroundColor: '#10B98115', borderRadius: 12, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.success,
  },
  workerLabel: { color: Colors.success, fontWeight: '700', fontSize: 12, marginBottom: 4 },
  workerUrl: { color: Colors.text, fontSize: 13, fontFamily: 'monospace' },
  envItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: Colors.card, padding: 14, borderRadius: 10,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.cardBorder,
  },
});
