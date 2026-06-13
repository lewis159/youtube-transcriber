-- Users synced from Clerk webhook
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text UNIQUE NOT NULL,
  email text NOT NULL,
  tier text NOT NULL DEFAULT 'explorer',  -- 'explorer' | 'creator' | 'studio' | 'enterprise'
  subscription_credits integer NOT NULL DEFAULT 3,
  purchased_credits integer NOT NULL DEFAULT 0,
  stripe_customer_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  youtube_id text NOT NULL,
  title text,
  thumbnail text,
  duration_seconds integer,
  status text DEFAULT 'pending',  -- pending | processing | done | error
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE UNIQUE,
  content jsonb NOT NULL,  -- [{text, start, duration}]
  language text
);

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  body text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (video_id, user_id)
);

CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES folders(id),
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS video_folders (
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  PRIMARY KEY (video_id, folder_id)
);

CREATE TABLE IF NOT EXISTS share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  allow_download boolean DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Feature flags — seeded per tier, overridable per user
CREATE TABLE IF NOT EXISTS tier_features (
  tier text NOT NULL,
  feature_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  PRIMARY KEY (tier, feature_key)
);

-- Seed tier features
INSERT INTO tier_features (tier, feature_key, enabled) VALUES
  -- Explorer (free, 3 videos lifetime)
  ('explorer', 'transcribe', true),
  ('explorer', 'notes', true),
  ('explorer', 'export_txt', true),
  ('explorer', 'export_pdf', false),
  ('explorer', 'folders', false),
  ('explorer', 'share_links', false),
  ('explorer', 'link_screenshots', false),
  ('explorer', 'ai_chapters', false),
  ('explorer', 'api_access', false),
  ('explorer', 'team_seats', false),
  ('explorer', 'credit_topup', false),
  -- Creator (£7/mo, 10 videos/mo + topups)
  ('creator', 'transcribe', true),
  ('creator', 'notes', true),
  ('creator', 'export_txt', true),
  ('creator', 'export_pdf', true),
  ('creator', 'folders', true),
  ('creator', 'share_links', false),
  ('creator', 'link_screenshots', false),
  ('creator', 'ai_chapters', false),
  ('creator', 'api_access', false),
  ('creator', 'team_seats', false),
  ('creator', 'credit_topup', true),
  -- Studio (£19/mo, 40 videos/mo + topups)
  ('studio', 'transcribe', true),
  ('studio', 'notes', true),
  ('studio', 'export_txt', true),
  ('studio', 'export_pdf', true),
  ('studio', 'folders', true),
  ('studio', 'share_links', true),
  ('studio', 'link_screenshots', true),
  ('studio', 'ai_chapters', true),
  ('studio', 'api_access', false),
  ('studio', 'team_seats', false),
  ('studio', 'credit_topup', true),
  -- Enterprise (£45/mo, unlimited)
  ('enterprise', 'transcribe', true),
  ('enterprise', 'notes', true),
  ('enterprise', 'export_txt', true),
  ('enterprise', 'export_pdf', true),
  ('enterprise', 'folders', true),
  ('enterprise', 'share_links', true),
  ('enterprise', 'link_screenshots', true),
  ('enterprise', 'ai_chapters', true),
  ('enterprise', 'api_access', true),
  ('enterprise', 'team_seats', true),
  ('enterprise', 'credit_topup', false)  -- unlimited, no topup needed
ON CONFLICT (tier, feature_key) DO NOTHING;

-- RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (used by API routes via supabaseAdmin)
-- Anon key used only for public share link reads (future)
