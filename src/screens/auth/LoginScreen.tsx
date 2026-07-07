import React, {useState} from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import {useAuthStore} from '../../store/authStore';

export default function LoginScreen({navigation}: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const signIn = useAuthStore(s => s.signIn);

  const handleLogin = async () => {
    if (!email || !password) {Alert.alert('Error', 'Enter email and password'); return;}
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      Alert.alert('Login Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.inner}>
        <Text style={s.title}>☁ MobileCloud</Text>
        <Text style={s.sub}>Cloud Platform Control Panel</Text>
        <View style={s.card}>
          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail}
            placeholder="you@example.com" placeholderTextColor="#4B5563"
            keyboardType="email-address" autoCapitalize="none" />
          <Text style={s.label}>Password</Text>
          <TextInput style={s.input} value={password} onChangeText={setPassword}
            placeholder="••••••••" placeholderTextColor="#4B5563" secureTextEntry />
          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Sign In</Text>}
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={s.link}>No account? <Text style={{color: '#3B82F6'}}>Register</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#080C14'},
  inner: {flex: 1, justifyContent: 'center', padding: 24},
  title: {fontSize: 32, fontWeight: '800', color: '#3B82F6', textAlign: 'center'},
  sub: {fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 32, marginTop: 8},
  card: {backgroundColor: '#111827', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1F2937'},
  label: {color: '#9CA3AF', fontSize: 13, marginBottom: 6, marginTop: 12},
  input: {backgroundColor: '#1F2937', borderRadius: 10, padding: 14, color: '#F9FAFB', fontSize: 15, borderWidth: 1, borderColor: '#374151'},
  btn: {backgroundColor: '#3B82F6', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 20},
  btnTxt: {color: '#fff', fontWeight: '700', fontSize: 16},
  link: {color: '#6B7280', textAlign: 'center', marginTop: 24},
});
