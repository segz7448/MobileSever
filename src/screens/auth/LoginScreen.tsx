import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../theme/colors';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const signIn = useAuthStore((s) => s.signIn);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Enter email and password'); return; }
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e: any) {
      Alert.alert('Login Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <Text style={styles.logo}>☁ MobileCloud</Text>
        <Text style={styles.subtitle}>Cloud Platform Control Panel</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
          />
          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign In</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Don't have an account? <Text style={styles.linkAccent}>Register</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 32, fontWeight: '800', color: Colors.accent, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 32 },
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.cardBorder },
  label: { color: Colors.textSecondary, fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: Colors.surface, borderRadius: 10, padding: 14, color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.cardBorder },
  btn: { backgroundColor: Colors.accent, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: Colors.textSecondary, textAlign: 'center', marginTop: 24, fontSize: 14 },
  linkAccent: { color: Colors.accent, fontWeight: '600' },
});
