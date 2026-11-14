const { createPool, migrate } = require('./db');
const { getConfig } = require('./config');
const { createApp } = require('./app');

async function start() {
  const config = getConfig();
  const pool = createPool(config);
  await migrate(pool);
  const app = createApp({ pool, config });
  const server = app.listen(config.port, () => {
    console.log(`Grove listening on http://localhost:${config.port}`);
  });
  const shutdown = async () => {
    server.close();
    await pool.end();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

if (require.main === module) start().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});

module.exports = { start };
