import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator, RefreshControl} from 'react-native';
import {supabase} from '../../services/supabase';

export default function ServersScreen({navigation}: any) {
  const [servers, setServers] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const {data} = await supabase.from('servers').select('*').order('created_at', {ascending: false});
    setServers(data || []);
  };

  useEffect(() => {load();}, []);

  const create = async () => {
    if (!name.trim()) {Alert.alert('Error', 'Enter a name'); return;}
    setCreating(true);
    try {
      const {data: {user}} = await supabase.auth.getUser();
      const {error} = await supabase.from('servers').insert({user_id: user?.id, name: name.trim(), status: 'stopped', region});
      if (error) throw error;
      setName(''); setShowCreate(false); load();
    } catch (e: any) {Alert.alert('Error', e.message);}
    setCreating(false);
  };

  const toggle = async (sv: any) => {
    const next = sv.status === 'running' ? 'stopped' : 'running';
    await supabase.from('servers').update({status: next}).eq('id', sv.id);
    load();
  };

  const del = (sv: any) => Alert.alert('Delete', `Delete "${sv.name}"?`, [
    {text: 'Cancel', style: 'cancel'},
    {text: 'Delete', style: 'destructive', onPress: async () => {await supabase.from('servers').delete().eq('id', sv.id); load();}},
  ]);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Servers</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowCreate(true)}>
          <Text style={s.addTxt}>+ New</Text>
        </TouchableOpacity>
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => {setRefreshing(true); await load(); setRefreshing(false);}} tintColor="#3B82F6" />}>
        {servers.map(sv => (
          <View key={sv.id} style={s.card}>
            <TouchableOpacity style={s.cardMain} onPress={() => navigation.navigate('ServerDetail', {server: sv})}>
              <View style={[s.dot, {backgroundColor: sv.status === 'running' ? '#10B981' : sv.status === 'error' ? '#EF4444' : '#4B5563'}]} />
              <View style={{flex: 1}}>
                <Text style={s.name}>{sv.name}</Text>
                <Text style={s.region}>{sv.region}</Text>
              </View>
              <Text style={{color: '#6B7280', fontSize: 12, textTransform: 'capitalize'}}>{sv.status}</Text>
            </TouchableOpacity>
            <View style={s.actions}>
              <TouchableOpacity style={[s.act, {backgroundColor: sv.status === 'running' ? '#1E1B4B' : '#052E16'}]} onPress={() => toggle(sv)}>
                <Text style={{color: sv.status === 'running' ? '#818CF8' : '#10B981', fontSize: 12, fontWeight: '700'}}>{sv.status === 'running' ? 'Stop' : 'Start'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.act, {backgroundColor: '#1F0A0A'}]} onPress={() => del(sv)}>
                <Text style={{color: '#EF4444', fontSize: 12, fontWeight: '700'}}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.act, {backgroundColor: '#0C1A33'}]} onPress={() => navigation.navigate('ServerDetail', {server: sv})}>
                <Text style={{color: '#3B82F6', fontSize: 12, fontWeight: '700'}}>Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {servers.length === 0 && <Text style={s.empty}>No servers. Tap "+ New" to create one.</Text>}
        <View style={{height: 40}} />
      </ScrollView>
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Create Server</Text>
            <Text style={s.lbl}>Name</Text>
            <TextInput style={s.input} value={name} onChangeText={setName} placeholder="my-server" placeholderTextColor="#4B5563" autoFocus />
            <Text style={s.lbl}>Region</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 16}}>
              {['us-east-1','us-west-2','eu-west-1','ap-southeast-1'].map(r => (
                <TouchableOpacity key={r} style={[s.chip, r === region && s.chipActive]} onPress={() => setRegion(r)}>
                  <Text style={{color: r === region ? '#fff' : '#6B7280', fontSize: 12}}>{r}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={s.btn} onPress={create} disabled={creating}>
              {creating ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Create</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={{padding: 12, alignItems: 'center'}} onPress={() => setShowCreate(false)}>
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
  card: {backgroundColor: '#111827', marginHorizontal: 16, marginBottom: 10, borderRadius: 14, borderWidth: 1, borderColor: '#1F2937'},
  cardMain: {flexDirection: 'row', alignItems: 'center', padding: 16},
  dot: {width: 8, height: 8, borderRadius: 4, marginRight: 12},
  name: {color: '#F9FAFB', fontWeight: '700', fontSize: 15},
  region: {color: '#4B5563', fontSize: 12, marginTop: 2},
  actions: {flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#1F2937', padding: 10, gap: 8},
  act: {flex: 1, padding: 8, borderRadius: 8, alignItems: 'center'},
  empty: {color: '#6B7280', textAlign: 'center', padding: 60},
  overlay: {flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end'},
  modal: {backgroundColor: '#111827', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24},
  modalTitle: {fontSize: 20, fontWeight: '800', color: '#F9FAFB', marginBottom: 20},
  lbl: {color: '#9CA3AF', fontSize: 13, marginBottom: 8},
  input: {backgroundColor: '#1F2937', borderRadius: 10, padding: 14, color: '#F9FAFB', fontSize: 15, borderWidth: 1, borderColor: '#374151', marginBottom: 16},
  chip: {backgroundColor: '#1F2937', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8},
  chipActive: {backgroundColor: '#3B82F6'},
  btn: {backgroundColor: '#3B82F6', borderRadius: 10, padding: 15, alignItems: 'center'},
  btnTxt: {color: '#fff', fontWeight: '700', fontSize: 16},
});
