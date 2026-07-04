import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const KEY_STORAGE = 'mc_enc_key';

const xorEncode = (text: string, key: string): string => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return Buffer.from(result, 'binary').toString('base64');
};

const xorDecode = (encoded: string, key: string): string => {
  try {
    const text = Buffer.from(encoded, 'base64').toString('binary');
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch { return ''; }
};

const getEncKey = async (): Promise<string> => {
  let key = await AsyncStorage.getItem(KEY_STORAGE);
  if (!key) {
    key = Math.random().toString(36).repeat(4) + Date.now().toString(36);
    await AsyncStorage.setItem(KEY_STORAGE, key);
  }
  return key;
};

export const saveCredential = async (type: string, label: string, data: Record<string, string>) => {
  const key = await getEncKey();
  const encrypted = xorEncode(JSON.stringify(data), key);
  const { data: user } = await supabase.auth.getUser();
  const { error } = await supabase.from('credentials').insert({
    user_id: user.user?.id, type, label, encrypted_data: encrypted,
  });
  if (error) throw error;
};

export const getCredentials = async () => {
  const key = await getEncKey();
  const { data, error } = await supabase.from('credentials').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((c: any) => {
    try {
      return { ...c, decrypted: JSON.parse(xorDecode(c.encrypted_data, key)) };
    } catch { return { ...c, decrypted: null }; }
  });
};

export const deleteCredential = async (id: string) => {
  const { error } = await supabase.from('credentials').delete().eq('id', id);
  if (error) throw error;
};
