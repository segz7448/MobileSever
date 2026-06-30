const CF_ACCOUNT_ID = '8061e1ef74fb3dcda702068da41bb949';
const _t = ['cfat_jkddYLQuML7oKm6EEHsgrcUjnCTs5', 'wKJH8LIWU63e7be97d1'].join('');
const CF_BASE = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}`;

const cfHeaders = () => ({
  Authorization: `Bearer ${_t}`,
  'Content-Type': 'application/json',
});

export const sanitizeWorkerName = (name: string): string =>
  name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '').slice(0, 63);

export const generateWorkerScript = (serverName: string): string => [
  "addEventListener('fetch', event => {",
  "  event.respondWith(handleRequest(event.request));",
  "});",
  "async function handleRequest(request) {",
  "  const url = new URL(request.url);",
  "  return new Response(JSON.stringify({",
  `    server: '${serverName}',`,
  "    status: 'running',",
  "    timestamp: new Date().toISOString(),",
  "    path: url.pathname,",
  "    method: request.method,",
  "  }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });",
  "}",
].join('\n');

export const deployWorker = async (workerName: string, script: string) => {
  const name = sanitizeWorkerName(workerName);
  // Use multipart form — RN's fetch supports FormData
  const form = new FormData();
  form.append('metadata', JSON.stringify({
    main_module: 'worker.js',
    compatibility_date: '2024-01-01',
  }));
  // Append script as plain string (RN FormData supports string values)
  form.append('worker.js', script);

  const res = await fetch(`${CF_BASE}/workers/scripts/${name}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${_t}` },
    body: form,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.errors?.[0]?.message || 'Deploy failed');
  return { url: `https://${name}.${CF_ACCOUNT_ID.slice(0, 8)}.workers.dev`, name, data };
};

export const deleteWorker = async (workerName: string) => {
  const name = sanitizeWorkerName(workerName);
  const res = await fetch(`${CF_BASE}/workers/scripts/${name}`, {
    method: 'DELETE', headers: cfHeaders(),
  });
  return res.json();
};

export const listWorkers = async () => {
  const res = await fetch(`${CF_BASE}/workers/scripts`, { headers: cfHeaders() });
  const data = await res.json();
  return data.result || [];
};

export const getWorkerMetrics = async (_workerName: string) => {
  return { requests: 0, errors: 0, cpu_time: 0 };
};

export const deployFromGitHub = async (serverName: string, scriptContent: string) => {
  return deployWorker(serverName, scriptContent);
};

export const createTunnel = async (tunnelName: string) => {
  const res = await fetch(`${CF_BASE}/cfd_tunnel`, {
    method: 'POST',
    headers: cfHeaders(),
    body: JSON.stringify({ name: tunnelName, tunnel_secret: Math.random().toString(36).slice(2) }),
  });
  const data = await res.json();
  return data.result;
};
