-- MobileCloud Supabase Schema
-- Paste this entire file into the Supabase SQL Editor and run it

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SERVERS
CREATE TABLE IF NOT EXISTS servers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'stopped' CHECK (status IN ('running', 'stopped', 'error', 'deploying')),
  region TEXT DEFAULT 'us-east-1',
  ip_address TEXT,
  port INTEGER DEFAULT 8080,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEPLOYMENTS
CREATE TABLE IF NOT EXISTS deployments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'deploying' CHECK (status IN ('deploying', 'success', 'failed')),
  github_repo TEXT,
  branch TEXT DEFAULT 'main',
  commit_hash TEXT,
  build_logs TEXT,
  deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREDENTIALS
CREATE TABLE IF NOT EXISTS credentials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  encrypted_data TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOMAINS
CREATE TABLE IF NOT EXISTS domains (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain TEXT NOT NULL,
  ssl_status TEXT DEFAULT 'pending' CHECK (ssl_status IN ('active', 'pending', 'failed')),
  cloudflare_zone_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENV VARIABLES
CREATE TABLE IF NOT EXISTS env_variables (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE NOT NULL,
  key TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LOGS
CREATE TABLE IF NOT EXISTS logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE NOT NULL,
  level TEXT DEFAULT 'INFO' CHECK (level IN ('INFO', 'WARN', 'ERROR', 'DEBUG')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEAMS
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEAM MEMBERS
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- BILLING
CREATE TABLE IF NOT EXISTS billing (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  stripe_customer_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE env_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;

-- Servers RLS
CREATE POLICY "Users manage own servers" ON servers FOR ALL USING (auth.uid() = user_id);
-- Deployments RLS
CREATE POLICY "Users manage own deployments" ON deployments FOR ALL USING (auth.uid() = user_id);
-- Credentials RLS
CREATE POLICY "Users manage own credentials" ON credentials FOR ALL USING (auth.uid() = user_id);
-- Domains RLS
CREATE POLICY "Users manage own domains" ON domains FOR ALL USING (auth.uid() = user_id);
-- Env Variables RLS (via server ownership)
CREATE POLICY "Users manage own env vars" ON env_variables FOR ALL
  USING (server_id IN (SELECT id FROM servers WHERE user_id = auth.uid()));
-- Logs RLS
CREATE POLICY "Users view own logs" ON logs FOR ALL
  USING (server_id IN (SELECT id FROM servers WHERE user_id = auth.uid()));
-- Teams RLS
CREATE POLICY "Team owners manage teams" ON teams FOR ALL USING (auth.uid() = owner_id);
-- Team Members RLS
CREATE POLICY "Team members view their teams" ON team_members FOR ALL
  USING (user_id = auth.uid() OR team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));
-- Billing RLS
CREATE POLICY "Users view own billing" ON billing FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- AUTO-CREATE BILLING ON SIGNUP (Postgres Trigger)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.billing (user_id, plan)
  VALUES (NEW.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- REALTIME (enable on tables)
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE servers;
ALTER PUBLICATION supabase_realtime ADD TABLE deployments;
ALTER PUBLICATION supabase_realtime ADD TABLE logs;

SELECT 'MobileCloud schema installed successfully!' as result;
