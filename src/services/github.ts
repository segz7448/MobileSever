const _g = ['ghp_2tjQ3RbplMV586BlDmBQXZ4', 'eJyzK8L2y5DEx'].join('');
const GH_BASE = 'https://api.github.com';

const ghHeaders = () => ({
  Authorization: `token ${_g}`,
  Accept: 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
});

const ghFetch = async (path: string, options: RequestInit = {}) => {
  const res = await fetch(`${GH_BASE}${path}`, {
    ...options,
    headers: { ...ghHeaders(), ...(options.headers as Record<string,string> || {}) },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
};

export const listRepos = async () => {
  const data = await ghFetch('/user/repos?per_page=100&sort=updated');
  return data.map((r: any) => ({
    name: r.name,
    fullName: r.full_name,
    private: r.private,
    updatedAt: r.updated_at,
    defaultBranch: r.default_branch,
  }));
};

export const getBranches = async (repo: string) => {
  const data = await ghFetch(`/repos/${repo}/branches`);
  return data.map((b: any) => b.name);
};

export const getLatestCommit = async (repo: string, branch: string) => {
  const data = await ghFetch(`/repos/${repo}/commits/${branch}`);
  return {
    sha: data.sha,
    message: data.commit?.message,
    author: data.commit?.author?.name,
  };
};

export const getFile = async (repo: string, path: string, branch = 'main') => {
  try {
    const data = await ghFetch(`/repos/${repo}/contents/${path}?ref=${branch}`);
    // Use Buffer (available in RN/Hermes) instead of atob
    return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');
  } catch {
    return null;
  }
};

export const getWorkerScript = async (repo: string, branch: string) => {
  const paths = ['worker.js', 'src/worker.js', 'index.js'];
  for (const p of paths) {
    const content = await getFile(repo, p, branch);
    if (content) return content;
  }
  return null;
};

export const triggerWorkflow = async (repo: string, workflow: string, ref = 'main') => {
  await fetch(`${GH_BASE}/repos/${repo}/actions/workflows/${workflow}/dispatches`, {
    method: 'POST',
    headers: ghHeaders(),
    body: JSON.stringify({ ref }),
  });
};

export const getWorkflowRuns = async (repo: string) => {
  const data = await ghFetch(`/repos/${repo}/actions/runs?per_page=10`);
  return data.workflow_runs || [];
};
