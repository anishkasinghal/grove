CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  password_hash TEXT,
  name TEXT NOT NULL DEFAULT 'there',
  google_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_auth_method CHECK (email IS NOT NULL OR google_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS user_data (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data_key TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, data_key)
);

CREATE INDEX IF NOT EXISTS user_data_user_id_idx ON user_data(user_id);
