import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator, RefreshControl } from 'react-native';
import { useServerStore } from '../../store/serverStore';
import { createServer } from '../../services/server';
import { Colors } from '../../theme/colors';

const REGIONS = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'];

export default function ServersScreen({ navigation }: any) {
  const { servers, fetchServers, removeServer, toggleServer, subscribeRealtime, addServer, loading } = useServerStore();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchServers();
    const unsub = subscribeRealtime();
    return unsub;
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Enter a server name'); return; }
    setCreating(true);
    try {
      const server = await createServer(name.trim(), region);
      addServer(server);
      setShowCreate(false);
      setName('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (id: string, serverName: string) => {
    Alert.alert('Delete Server', `Delete "${serverName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeServer(id) },
    ]);
  };

  const statusColor = (s: string) => s === 'running' ? Colors.success : s === 'error' ? Colors.error : Colors.textMuted;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Servers</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchServers(); setRefreshing(false); }} tintColor={Colors.accent} />}>
        {loading && <ActivityIndicator color={Colors.accent} style={{ margin: 20 }} />}
        {servers.map((s) => (
          <View key={s.id} style={styles.card}>
            <TouchableOpacity style={styles.cardMain} onPress={() => navigation.navigate('ServerDetail', { server: s })}>
              <View style={[styles.dot, { backgroundColor: statusColor(s.status) }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{s.name}</Text>
                <Text style={styles.region}>{s.region} · Port {s.port}</Text>
              </View>
              <Text style={[styles.status, { color: statusColor(s.status) }]}>{s.status}</Text>
            </TouchableOpacity>
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: s.status === 'running' ? '#7C3AED20' : '#10B98120' }]} onPress={() => toggleServer(s.id)}>
                <Text style={{ color: s.status === 'running' ? '#7C3AED' : Colors.success, fontSize: 12, fontWeight: '700' }}>
                  {s.status === 'running' ? 'Stop' : 'Start'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EF444420' }]} onPress={() => handleDelete(s.id, s.name)}>
                <Text style={{ color: Colors.error, fontSize: 12, fontWeight: '700' }}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3B82F620' }]} onPress={() => navigation.navigate('ServerDetail', { server: s })}>
                <Text style={{ color: Colors.accent, fontSize: 12, fontWeight: '700' }}>Details →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {servers.length === 0 && !loading && (
          <View style={styles.empty}><Text style={styles.emptyText}>No servers. Tap "+ New" to create one.</Text></View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Create Server</Text>
            <Text style={styles.label}>Server Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="my-server" placeholderTextColor={Colors.textMuted} autoFocus />
            <Text style={styles.label}>Region</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {REGIONS.map((r) => (
                <TouchableOpacity key={r} style={[styles.regionChip, r === region && styles.regionActive]} onPress={() => setRegion(r)}>
                  <Text style={[styles.regionText, r === region && { color: '#fff' }]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={creating}>
              {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Create Server</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  addBtn: { backgroundColor: Colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: Colors.card, marginHorizontal: 16, marginBottom: 10, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden' },
  cardMain: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  name: { color: Colors.text, fontWeight: '700', fontSize: 15 },
  region: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  status: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.cardBorder, padding: 10, gap: 8 },
  actionBtn: { flex: 1, padding: 8, borderRadius: 8, alignItems: 'center' },
  empty: { alignItems: 'center', padding: 60 },
  emptyText: { color: Colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 20 },
  label: { color: Colors.textSecondary, fontSize: 13, marginBottom: 8 },
  input: { backgroundColor: Colors.surface, borderRadius: 10, padding: 14, color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 16 },
  regionChip: { backgroundColor: Colors.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: Colors.cardBorder },
  regionActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  regionText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  createBtn: { backgroundColor: Colors.accent, borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 10 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: { padding: 12, alignItems: 'center' },
  cancelText: { color: Colors.textSecondary, fontSize: 14 },
});
