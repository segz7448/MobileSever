import CryptoJS from 'react-native-crypto-js';
import { supabase } from './supabase';
import { MMKV } from 'react-native-mmkv';

const keyStorage = new MMKV({ id: 'cred-key' });

const getOrCreateKey = () => {
  let key = keyStorage.getString('enc_key');
  if (!key) {
    key = CryptoJS.lib.WordArray.random(32).toString();
    keyStorage.set('enc_key', key);
  }
  return key;
};

export const saveCredential = async (type: string, label: string, data: Record<string, string>) => {
  const key = getOrCreateKey();
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
  const { data: user } = await supabase.auth.getUser();
  const { error } = await supabase.from('credentials').insert({
    user_id: user.user?.id,
    type,
    label,
    encrypted_data: encrypted,
  });
  if (error) throw error;
};

export const getCredentials = async () => {
  const key = getOrCreateKey();
  const { data, error } = await supabase.from('credentials').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((c: any) => {
    try {
      const bytes = CryptoJS.AES.decrypt(c.encrypted_data, key);
      const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      return { ...c, decrypted };
    } catch {
      return { ...c, decrypted: null };
    }
  });
};

export const deleteCredential = async (id: string) => {
  const { error } = await supabase.from('credentials').delete().eq('id', id);
  if (error) throw error;
};
