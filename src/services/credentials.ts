import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';

// Simple XOR + base64 obfuscation (SecureStore handles the real security at OS level)
const obfuscate = (text: string, key: string): string => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
};

const deobfuscate = (encoded: string, key: string): string => {
  try {
    const text = atob(encoded);
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    return '';
  }
};

const getEncKey = async (): Promise<string> => {
  let key = await SecureStore.getItemAsync('mc_enc_key');
  if (!key) {
    key = Math.random().toString(36).repeat(4) + Date.now().toString(36);
    await SecureStore.setItemAsync('mc_enc_key', key);
  }
  return key;
};

export const saveCredential = async (
  type: string,
  label: string,
  data: Record<string, string>
): Promise<void> => {
  const key = await getEncKey();
  const encrypted = obfuscate(JSON.stringify(data), key);
  const { data: user } = await supabase.auth.getUser();
  const { error } = await supabase.from('credentials').insert({
    user_id: user.user?.id,
    type,
    label,
    encrypted_data: encrypted,
  });
  if (error) throw error;
};

export const getCredentials = async (): Promise<any[]> => {
  const key = await getEncKey();
  const { data, error } = await supabase
    .from('credentials')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((c: any) => {
    try {
      const decrypted = JSON.parse(deobfuscate(c.encrypted_data, key));
      return { ...c, decrypted };
    } catch {
      return { ...c, decrypted: null };
    }
  });
};

export const deleteCredential = async (id: string): Promise<void> => {
  const { error } = await supabase.from('credentials').delete().eq('id', id);
  if (error) throw error;
};
