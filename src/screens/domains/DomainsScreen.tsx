import React, {useState, useEffect} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator} from 'react-native';
import {supabase} from '../../services/supabase';

export default function DomainsScreen() {
  const [domains, setDomains] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [domain, setDomain] = useState('');
  const [serverId, setServerId] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const {data} = await supabase.from('domains').select('*, servers(name)').order('created_at', {ascending: false});
    setDomains(data || []);
    const {data: sv} = await supabase.from('servers').select('id,name');
    setServers(sv || []);
  };

  useEffect(() => {load();}, []);

  const add = async () => {
    if (!domain || !serverId) {Alert.alert('Error', 'Fill all fields'); return;}
    setLoading(true);
    try {
      const {data: {user}} = await supabase.auth.getUser();
      await supabase.from('domains').insert({server_id: serverId, user_id: user?.id, domain, ssl_status: 'pending'});
      setDomain(''); setShowAdd(false); load();
    } catch (e: any) {Alert.alert('Error', e.message);}
    setLoading(false);
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Domains</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={s.addTxt}>+ Add</Text>
        </TouchableOpacity>
      </View>
      <ScrollView>
        {domains.map(d => (
          <View key={d.id} style={s.card}>
            <Text style={s.domain}>{d.domain}</Text>
            <Text style={{color: '#4B5563', fontSize: 12, marginTop: 4}}>{(d.servers as any)?.name}</Text>
            <Text style={{color: d.ssl_status === 'active' ? '#10B981' : '#F59E0B', fontSize: 12, marginTop: 8}}>SSL: {d.ssl_status}</Text>
          </View>
        ))}
        {domains.length === 0 && <Text style={s.empty}>No domains yet.</Text>}
      </ScrollView>
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Add Domain</Text>
            <TextInput style={s.input} value={domain} onChangeText={setDomain} placeholder="example.com" placeholderTextColor="#4B5563" autoCapitalize="none" />
            {servers.map(sv => (
              <TouchableOpacity key={sv.id} style={[s.svBtn, serverId === sv.id && {backgroundColor: '#3B82F6', borderColor: '#3B82F6'}]} onPress={() => setServerId(sv.id)}>
                <Text style={{color: serverId === sv.id ? '#fff' : '#9CA3AF', fontSize: 13}}>{sv.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.btn} onPress={add} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Add Domain</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={{padding: 12, alignItems: 'center'}} onPress={() => setShowAdd(false)}>
              <Text style={{color: '#6B7280'}}>Cancel</Text>
            </TouchableOpacity>
          </View>
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
  card: {backgroundColor: '#111827', marginHorizontal: 16, marginBottom: 10, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#1F2937'},
  domain: {color: '#F9FAFB', fontWeight: '700', fontSize: 16},
  empty: {color: '#4B5563', textAlign: 'center', padding: 60},
  overlay: {flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end'},
  modal: {backgroundColor: '#111827', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24},
  modalTitle: {fontSize: 20, fontWeight: '800', color: '#F9FAFB', marginBottom: 20},
  input: {backgroundColor: '#1F2937', borderRadius: 10, padding: 14, color: '#F9FAFB', fontSize: 15, borderWidth: 1, borderColor: '#374151', marginBottom: 14},
  svBtn: {backgroundColor: '#1F2937', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#374151'},
  btn: {backgroundColor: '#3B82F6', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 8},
  btnTxt: {color: '#fff', fontWeight: '700', fontSize: 16},
});
