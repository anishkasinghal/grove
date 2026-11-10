const express = require('express');
const path = require('node:path');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { cloneDefaults } = require('./defaults');
const { hashPassword, verifyPassword, createToken, requireAuth } = require('./auth');

const DATA_KEYS = Object.keys(cloneDefaults());
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeUser(user) {
  return { id: user.id, email: user.email, name: user.name };
}

function createApp({ pool, config }) {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use(passport.initialize());

  const findUser = async id => (await pool.query(
    'SELECT id, email, name, password_hash, google_id FROM users WHERE id = $1',
    [id]
  )).rows[0];
  const auth = requireAuth({ secret: config.jwtSecret, findUser });

  if (config.googleClientId && config.googleClientSecret) {
    passport.use(new GoogleStrategy({
      clientID: config.googleClientId,
      clientSecret: config.googleClientSecret,
      callbackURL: config.googleCallbackUrl
    }, async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || null;
        const name = profile.displayName || 'there';
        const existing = await pool.query(
          'SELECT id, email, name FROM users WHERE google_id = $1 OR email = $2 LIMIT 1',
          [profile.id, email]
        );
        if (existing.rows[0]) {
          const result = await pool.query(
            'UPDATE users SET email = $1, name = $2, google_id = $3 WHERE id = $4 RETURNING id, email, name',
            [email, name, profile.id, existing.rows[0].id]
          );
          return done(null, result.rows[0]);
        }
        const result = await pool.query(
          'INSERT INTO users (email, name, google_id) VALUES ($1, $2, $3) RETURNING id, email, name',
          [email, name, profile.id]
        );
        done(null, result.rows[0]);
      } catch (error) {
        done(error);
      }
    }));
  }

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.post('/api/auth/register', async (req, res, next) => {
    try {
      const email = String(req.body.email || '').trim().toLowerCase();
      const password = String(req.body.password || '');
      const name = String(req.body.name || 'there').trim() || 'there';
      if (!emailPattern.test(email) || password.length < 8) {
        return res.status(400).json({ error: 'A valid email and password of at least 8 characters are required' });
      }
      const passwordHash = await hashPassword(password);
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
        [email, passwordHash, name]
      );
      const user = result.rows[0];
      res.status(201).json({ user: safeUser(user), token: createToken(user, config.jwtSecret) });
    } catch (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'An account with that email already exists' });
      next(error);
    }
  });

  app.post('/api/auth/login', async (req, res, next) => {
    try {
      const email = String(req.body.email || '').trim().toLowerCase();
      const password = String(req.body.password || '');
      const result = await pool.query('SELECT id, email, name, password_hash FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      if (!user || !user.password_hash || !(await verifyPassword(password, user.password_hash))) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      res.json({ user: safeUser(user), token: createToken(user, config.jwtSecret) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/auth/google', (req, res, next) => {
    if (!config.googleClientId || !config.googleClientSecret) {
      return res.status(503).json({ error: 'Google sign-in is not configured' });
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  });

  app.get('/api/auth/google/callback', (req, res, next) => {
    if (!config.googleClientId || !config.googleClientSecret) {
      return res.status(503).json({ error: 'Google sign-in is not configured' });
    }
    passport.authenticate('google', { session: false }, (error, user) => {
      if (error || !user) return res.redirect('/?authError=google');
      const token = createToken(user, config.jwtSecret);
      res.redirect(`/?token=${encodeURIComponent(token)}`);
    })(req, res, next);
  });

  app.get('/api/me', auth, (req, res) => res.json({ user: safeUser(req.user) }));

  app.get('/api/data', auth, async (req, res, next) => {
    try {
      const rows = await pool.query('SELECT data_key, value FROM user_data WHERE user_id = $1', [req.user.id]);
      const data = cloneDefaults();
      rows.rows.forEach(row => { if (DATA_KEYS.includes(row.data_key)) data[row.data_key] = row.value; });
      data.settings = { ...data.settings, name: req.user.name || data.settings.name };
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  app.put('/api/data/:key', auth, async (req, res, next) => {
    try {
      const key = req.params.key;
      if (!DATA_KEYS.includes(key)) return res.status(404).json({ error: 'Unknown data key' });
      await pool.query(
        `INSERT INTO user_data (user_id, data_key, value, updated_at)
         VALUES ($1, $2, $3::jsonb, NOW())
         ON CONFLICT (user_id, data_key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [req.user.id, key, JSON.stringify(req.body.value)]
      );
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/data/export', auth, async (req, res, next) => {
    try {
      const rows = await pool.query('SELECT data_key, value FROM user_data WHERE user_id = $1', [req.user.id]);
      const data = cloneDefaults();
      rows.rows.forEach(row => { if (DATA_KEYS.includes(row.data_key)) data[row.data_key] = row.value; });
      res.json({ exportedAt: new Date().toISOString(), data });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/data/import', auth, async (req, res, next) => {
    const data = req.body.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return res.status(400).json({ error: 'Import must contain a data object' });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const key of DATA_KEYS) {
        if (data[key] !== undefined) {
          await client.query(
            `INSERT INTO user_data (user_id, data_key, value, updated_at)
             VALUES ($1, $2, $3::jsonb, NOW())
             ON CONFLICT (user_id, data_key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
            [req.user.id, key, JSON.stringify(data[key])]
          );
        }
      }
      await client.query('COMMIT');
      res.status(204).end();
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  });

  app.use(express.static(path.join(__dirname, '..')));
  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

module.exports = { createApp };
