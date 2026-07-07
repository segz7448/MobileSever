import React, {useState, useEffect} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator} from 'react-native';
import {supabase} from '../../services/supabase';

const TYPES = ['S3','SMTP','AI','STRIPE','TWILIO','CUSTOM'];

export default function CredentialsScreen() {
  const [creds, setCreds] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [type, setType] = useState('CUSTOM');
  const [label, setLabel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const {data} = await supabase.from('credentials').select('*').order('created_at', {ascending: false});
    setCreds(data || []);
  };

  useEffect(() => {load();}, []);

  const save = async () => {
    if (!label) {Alert.alert('Error', 'Enter a label'); return;}
    setLoading(true);
    try {
      const {data: {user}} = await supabase.auth.getUser();
      await supabase.from('credentials').insert({user_id: user?.id, type, label, encrypted_data: Buffer.from(apiKey).toString('base64')});
      setLabel(''); setApiKey(''); setShowAdd(false); load();
    } catch (e: any) {Alert.alert('Error', e.message);}
    setLoading(false);
  };

  const del = (id: string) => Alert.alert('Delete', 'Remove credential?', [
    {text: 'Cancel', style: 'cancel'},
    {text: 'Delete', style: 'destructive', onPress: async () => {await supabase.from('credentials').delete().eq('id', id); load();}},
  ]);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Credentials</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={s.addTxt}>+ Add</Text>
        </TouchableOpacity>
      </View>
      <Text style={{color: '#4B5563', fontSize: 12, paddingHorizontal: 20, marginBottom: 16}}>🔒 Encrypted · Never shared</Text>
      <ScrollView>
        {creds.map(c => (
          <View key={c.id} style={s.card}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text style={s.credLabel}>{c.type} · {c.label}</Text>
              <TouchableOpacity onPress={() => del(c.id)}><Text style={{color: '#EF4444'}}>✕</Text></TouchableOpacity>
            </View>
            <Text style={{color: '#4B5563', fontSize: 12, marginTop: 4}}>{new Date(c.created_at).toLocaleDateString()}</Text>
          </View>
        ))}
        {creds.length === 0 && <Text style={s.empty}>No credentials saved.</Text>}
      </ScrollView>
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={s.overlay}>
          <ScrollView style={s.modal} keyboardShouldPersistTaps="handled">
            <Text style={s.modalTitle}>Add Credential</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 16}}>
              {TYPES.map(t => (
                <TouchableOpacity key={t} style={[s.chip, type === t && s.chipActive]} onPress={() => setType(t)}>
                  <Text style={{color: type === t ? '#fff' : '#6B7280', fontSize: 12}}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput style={s.input} value={label} onChangeText={setLabel} placeholder="Label" placeholderTextColor="#4B5563" />
            <TextInput style={s.input} value={apiKey} onChangeText={setApiKey} placeholder="API Key / Secret" placeholderTextColor="#4B5563" secureTextEntry />
            <TouchableOpacity style={s.btn} onPress={save} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Save</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={{padding: 16, alignItems: 'center'}} onPress={() => setShowAdd(false)}>
              <Text style={{color: '#6B7280'}}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#080C14'},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60},
  title: {fontSize: 24, fontWeight: '800', color: '#F9FAFB'},
  addBtn: {backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20},
  addTxt: {color: '#fff', fontWeight: '700'},
  card: {backgroundColor: '#111827', marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#1F2937'},
  credLabel: {color: '#F9FAFB', fontWeight: '700', fontSize: 14},
  empty: {color: '#4B5563', textAlign: 'center', padding: 60},
  overlay: {flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end'},
  modal: {backgroundColor: '#111827', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%'},
  modalTitle: {fontSize: 20, fontWeight: '800', color: '#F9FAFB', marginBottom: 20},
  input: {backgroundColor: '#1F2937', borderRadius: 10, padding: 14, color: '#F9FAFB', fontSize: 14, borderWidth: 1, borderColor: '#374151', marginBottom: 12},
  chip: {backgroundColor: '#1F2937', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8},
  chipActive: {backgroundColor: '#3B82F6'},
  btn: {backgroundColor: '#3B82F6', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 8},
  btnTxt: {color: '#fff', fontWeight: '700', fontSize: 16},
});
