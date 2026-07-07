import React from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {useAuthStore} from '../../store/authStore';

export default function SettingsScreen() {
  const {user, signOut} = useAuthStore();

  const handleSignOut = () => Alert.alert('Sign Out', 'Are you sure?', [
    {text: 'Cancel', style: 'cancel'},
    {text: 'Sign Out', style: 'destructive', onPress: signOut},
  ]);

  return (
    <ScrollView style={s.container}>
      <Text style={s.title}>Settings</Text>
      <View style={s.section}>
        <Text style={s.sectionTitle}>PROFILE</Text>
        <View style={s.card}>
          <View style={s.row}><Text style={s.rowLabel}>Email</Text><Text style={s.rowVal}>{user?.email}</Text></View>
        </View>
      </View>
      <View style={s.section}>
        <Text style={s.sectionTitle}>ACCOUNT</Text>
        <View style={s.card}>
          <TouchableOpacity style={[s.row, {borderBottomWidth: 0}]} onPress={handleSignOut}>
            <Text style={[s.rowLabel, {color: '#EF4444'}]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{height: 60}} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#080C14'},
  title: {fontSize: 24, fontWeight: '800', color: '#F9FAFB', padding: 20, paddingTop: 60},
  section: {marginHorizontal: 16, marginBottom: 16},
  sectionTitle: {fontSize: 12, color: '#4B5563', fontWeight: '700', marginBottom: 8, letterSpacing: 1},
  card: {backgroundColor: '#111827', borderRadius: 14, borderWidth: 1, borderColor: '#1F2937', overflow: 'hidden'},
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1F2937'},
  rowLabel: {color: '#F9FAFB', fontSize: 15},
  rowVal: {color: '#6B7280', fontSize: 14},
});
