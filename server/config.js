require('dotenv').config();

function getConfig(env = process.env) {
  return {
    port: Number(env.PORT || 3000),
    databaseUrl: env.DATABASE_URL,
    jwtSecret: env.JWT_SECRET,
    frontendOrigin: env.FRONTEND_ORIGIN,
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    googleCallbackUrl: env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback'
  };
}

function assertConfig(config) {
  const missing = [];
  if (!config.databaseUrl) missing.push('DATABASE_URL');
  if (!config.jwtSecret) missing.push('JWT_SECRET');
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

module.exports = { getConfig, assertConfig };
