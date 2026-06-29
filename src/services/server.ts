import { supabase } from './supabase';

export const getServers = async () => {
  const { data, error } = await supabase
    .from('servers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createServer = async (name: string, region: string) => {
  const { data: user } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('servers')
    .insert({ user_id: user.user?.id, name, status: 'stopped', region, ip_address: null, port: 8080 })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateServerStatus = async (id: string, status: string) => {
  const { error } = await supabase.from('servers').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
};

export const deleteServer = async (id: string) => {
  const { error } = await supabase.from('servers').delete().eq('id', id);
  if (error) throw error;
};

export const getDeployments = async (serverId: string) => {
  const { data, error } = await supabase
    .from('deployments')
    .select('*')
    .eq('server_id', serverId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createDeployment = async (serverId: string, repo: string, branch: string, commitHash: string, workerUrl?: string) => {
  const { data: user } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('deployments')
    .insert({
      server_id: serverId,
      user_id: user.user?.id,
      status: 'deploying',
      github_repo: repo,
      branch,
      commit_hash: commitHash,
      build_logs: workerUrl ? `Worker URL: ${workerUrl}` : '',
      deployed_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getLogs = async (serverId: string, level?: string) => {
  let query = supabase.from('logs').select('*').eq('server_id', serverId).order('created_at', { ascending: false }).limit(200);
  if (level && level !== 'ALL') query = query.eq('level', level);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const addLog = async (serverId: string, level: string, message: string) => {
  const { error } = await supabase.from('logs').insert({ server_id: serverId, level, message });
  if (error) throw error;
};

export const getDomains = async (serverId: string) => {
  const { data, error } = await supabase.from('domains').select('*').eq('server_id', serverId);
  if (error) throw error;
  return data || [];
};

export const addDomain = async (serverId: string, domain: string) => {
  const { data: user } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('domains')
    .insert({ server_id: serverId, user_id: user.user?.id, domain, ssl_status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data;
};
