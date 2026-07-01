function resolveDbConfig(overrides = {}) {
  const host = overrides.host || process.env.DB_HOSTNAME || process.env.DB_HOST || '127.0.0.1';
  const port = overrides.port || process.env.DB_PORT || '3306';
  const user = overrides.user || process.env.DB_USER || 'root';
  const password = overrides.password || process.env.DB_PASSWORD || '';
  const database = overrides.database || process.env.DB_DATABASE || process.env.DB_NAME || 'cohortle';

  return {
    host,
    port,
    user,
    password,
    database,
  };
}

module.exports = {
  resolveDbConfig,
};
