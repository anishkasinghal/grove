const { createPool, migrate } = require('./db');
const { getConfig } = require('./config');

migrate(createPool(getConfig()))
  .then(() => console.log('Database schema is ready'))
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => setTimeout(() => process.exit(), 0));
