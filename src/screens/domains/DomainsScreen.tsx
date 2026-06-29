import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { supabase } from '../../services/supabase';
import { addDomain } from '../../services/server';
import { useServerStore } from '../../store/serverStore';
import { Colors } from '../../theme/colors';

export default function DomainsScreen() {
  const { servers, fetchServers } = useServerStore();
  const [domains, setDomains] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [domain, setDomain] = useState('');
  const [serverId, setServerId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchServers(); loadDomains(); }, []);

  const loadDomains = async () => {
    const { data } = await supabase.from('domains').select('*, servers(name)').order('created_at', { ascending: false });
    setDomains(data || []);
  };

  const handleAdd = async () => {
    if (!domain || !serverId) { Alert.alert('Error', 'Fill all fields'); return; }
    setLoading(true);
    try {
      await addDomain(serverId, domain);
      setDomain(''); setShowAdd(false);
      loadDomains();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const sslColor = (s: string) => s === 'active' ? Colors.success : s === 'pending' ? Colors.warning : Colors.error;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Domains</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>
      <ScrollView>
        {domains.map((d) => (
          <View key={d.id} style={styles.card}>
            <Text style={styles.domain}>{d.domain}</Text>
            <Text style={styles.serverName}>{d.servers?.name || 'Unknown Server'}</Text>
            <View style={styles.row}>
              <View style={[styles.sslBadge, { backgroundColor: sslColor(d.ssl_status) + '20', borderColor: sslColor(d.ssl_status) }]}>
                <Text style={[styles.sslText, { color: sslColor(d.ssl_status) }]}>SSL: {d.ssl_status}</Text>
              </View>
              <Text style={styles.date}>{new Date(d.created_at).toLocaleDateString()}</Text>
            </View>
          </View>
        ))}
        {domains.length === 0 && <View style={styles.empty}><Text style={styles.emptyText}>No domains configured yet.</Text></View>}
      </ScrollView>

      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Domain</Text>
            <Text style={styles.label}>Domain</Text>
            <TextInput style={styles.input} value={domain} onChangeText={setDomain} placeholder="example.com" placeholderTextColor={Colors.textMuted} autoCapitalize="none" />
            <Text style={styles.label}>Server</Text>
            {servers.map((s) => (
              <TouchableOpacity key={s.id} style={[styles.serverOption, serverId === s.id && styles.serverOptionActive]} onPress={() => setServerId(s.id)}>
                <Text style={{ color: serverId === s.id ? '#fff' : Colors.textSecondary, fontSize: 13 }}>{s.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.submitBtn} onPress={handleAdd} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Add Domain</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAdd(false)} style={{ padding: 12, alignItems: 'center' }}>
              <Text style={{ color: Colors.textSecondary }}>Cancel</Text>
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
  card: { backgroundColor: Colors.card, marginHorizontal: 16, marginBottom: 10, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder },
  domain: { color: Colors.text, fontWeight: '700', fontSize: 16 },
  serverName: { color: Colors.textMuted, fontSize: 12, marginTop: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  sslBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  sslText: { fontSize: 11, fontWeight: '700' },
  date: { color: Colors.textMuted, fontSize: 11 },
  empty: { alignItems: 'center', padding: 60 },
  emptyText: { color: Colors.textSecondary },
  overlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 20 },
  label: { color: Colors.textSecondary, fontSize: 13, marginBottom: 8 },
  input: { backgroundColor: Colors.surface, borderRadius: 10, padding: 14, color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 14 },
  serverOption: { backgroundColor: Colors.surface, padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: Colors.cardBorder },
  serverOptionActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  submitBtn: { backgroundColor: Colors.accent, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
