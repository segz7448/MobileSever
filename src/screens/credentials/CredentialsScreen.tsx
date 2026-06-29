import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { saveCredential, getCredentials, deleteCredential } from '../../services/credentials';
import { Colors } from '../../theme/colors';

const CRED_TYPES = [
  { id: 'S3', label: '☁ S3/Storage', fields: ['endpoint', 'bucket', 'accessKey', 'secretKey'] },
  { id: 'SMTP', label: '✉ SMTP/Email', fields: ['host', 'port', 'username', 'password'] },
  { id: 'AI', label: '🤖 AI Provider', fields: ['provider', 'apiKey', 'model'] },
  { id: 'STRIPE', label: '💳 Stripe', fields: ['publicKey', 'secretKey', 'webhookSecret'] },
  { id: 'TWILIO', label: '📱 Twilio', fields: ['accountSid', 'authToken', 'phoneNumber'] },
  { id: 'CUSTOM', label: '🔑 Custom API', fields: ['name', 'apiKey', 'baseUrl'] },
];

export default function CredentialsScreen() {
  const [creds, setCreds] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedType, setSelectedType] = useState(CRED_TYPES[0]);
  const [label, setLabel] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadCreds(); }, []);

  const loadCreds = async () => {
    try { setCreds(await getCredentials()); } catch {}
  };

  const handleSave = async () => {
    if (!label) { Alert.alert('Error', 'Enter a label'); return; }
    setLoading(true);
    try {
      await saveCredential(selectedType.id, label, fields);
      setShowAdd(false); setLabel(''); setFields({});
      loadCreds();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this credential?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteCredential(id); loadCreds(); } },
    ]);
  };

  const typeInfo = (type: string) => CRED_TYPES.find((t) => t.id === type) || CRED_TYPES[5];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Credentials Vault</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>🔒 AES encrypted · Never leaves your device</Text>
      <ScrollView>
        {creds.map((c) => (
          <View key={c.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.credLabel}>{typeInfo(c.type).label} · {c.label}</Text>
              <TouchableOpacity onPress={() => handleDelete(c.id)}>
                <Text style={{ color: Colors.error, fontSize: 12 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.credType}>{c.type}</Text>
            <Text style={styles.credDate}>{new Date(c.created_at).toLocaleDateString()}</Text>
          </View>
        ))}
        {creds.length === 0 && <View style={styles.empty}><Text style={styles.emptyText}>No credentials saved yet.</Text></View>}
      </ScrollView>

      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.overlay}>
          <ScrollView style={styles.modal} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Add Credential</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {CRED_TYPES.map((t) => (
                <TouchableOpacity key={t.id} style={[styles.typeChip, selectedType.id === t.id && styles.typeChipActive]} onPress={() => { setSelectedType(t); setFields({}); }}>
                  <Text style={[styles.typeText, selectedType.id === t.id && { color: '#fff' }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>Label</Text>
            <TextInput style={styles.input} value={label} onChangeText={setLabel} placeholder="My S3 Bucket" placeholderTextColor={Colors.textMuted} />
            {selectedType.fields.map((f) => (
              <View key={f}>
                <Text style={styles.label}>{f}</Text>
                <TextInput style={styles.input} value={fields[f] || ''} onChangeText={(v) => setFields((prev) => ({ ...prev, [f]: v }))} placeholder={f} placeholderTextColor={Colors.textMuted} secureTextEntry={f.toLowerCase().includes('key') || f.toLowerCase().includes('secret') || f === 'password'} />
              </View>
            ))}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Credential</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 16, alignItems: 'center' }} onPress={() => setShowAdd(false)}>
              <Text style={{ color: Colors.textSecondary }}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
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
  subtitle: { fontSize: 12, color: Colors.textMuted, paddingHorizontal: 20, marginBottom: 16 },
  card: { backgroundColor: Colors.card, marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  credLabel: { color: Colors.text, fontWeight: '700', fontSize: 14 },
  credType: { color: Colors.accent, fontSize: 12, marginTop: 2 },
  credDate: { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
  empty: { alignItems: 'center', padding: 60 },
  emptyText: { color: Colors.textSecondary },
  overlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 20 },
  label: { color: Colors.textSecondary, fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: Colors.surface, borderRadius: 10, padding: 14, color: Colors.text, fontSize: 14, borderWidth: 1, borderColor: Colors.cardBorder },
  typeChip: { backgroundColor: Colors.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: Colors.cardBorder },
  typeChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  typeText: { color: Colors.textSecondary, fontSize: 12 },
  saveBtn: { backgroundColor: Colors.accent, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
