import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../services/supabase';
import { Colors } from '../../theme/colors';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

const Row = ({ label, value, onPress, danger }: { label: string; value?: string; onPress?: () => void; danger?: boolean }) => (
  <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
    <Text style={[styles.rowLabel, danger && { color: Colors.error }]}>{label}</Text>
    {value && <Text style={styles.rowValue}>{value}</Text>}
    {onPress && <Text style={styles.arrow}>›</Text>}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [showPassInput, setShowPassInput] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      Alert.alert('Success', 'Password updated');
      setNewPassword(''); setShowPassInput(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <Section title="Profile">
        <Row label="Email" value={user?.email || ''} />
        <Row label="User ID" value={user?.id?.slice(0, 8) + '...' || ''} />
      </Section>

      <Section title="Security">
        <Row label="Change Password" onPress={() => setShowPassInput(!showPassInput)} />
        {showPassInput && (
          <View style={{ padding: 12 }}>
            <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} placeholder="New password" placeholderTextColor={Colors.textMuted} secureTextEntry />
            <TouchableOpacity style={styles.btn} onPress={handleChangePassword}>
              <Text style={styles.btnText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        )}
      </Section>

      <Section title="Notifications">
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text style={styles.rowLabel}>Push Notifications</Text>
          <Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: Colors.accent }} thumbColor="#fff" />
        </View>
      </Section>

      <Section title="Billing">
        <Row label="Current Plan" value="Free" />
        <Row label="Upgrade to Pro" onPress={() => Alert.alert('Coming Soon', 'Pro plan coming soon!')} />
      </Section>

      <Section title="Team">
        <Row label="Manage Team" onPress={() => Alert.alert('Coming Soon', 'Team management coming soon!')} />
        <Row label="Invite Member" onPress={() => Alert.alert('Coming Soon')} />
      </Section>

      <Section title="Account">
        <Row label="Sign Out" onPress={handleSignOut} danger />
      </Section>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, padding: 20, paddingTop: 60 },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 12, color: Colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  sectionCard: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  rowLabel: { flex: 1, color: Colors.text, fontSize: 15 },
  rowValue: { color: Colors.textSecondary, fontSize: 14, marginRight: 8 },
  arrow: { color: Colors.textMuted, fontSize: 20 },
  input: { backgroundColor: Colors.surface, borderRadius: 10, padding: 14, color: Colors.text, fontSize: 14, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 10 },
  btn: { backgroundColor: Colors.accent, borderRadius: 10, padding: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
