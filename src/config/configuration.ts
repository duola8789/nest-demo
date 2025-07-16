export default () => {
  const ENV_NODE_ENV = process.env.NODE_ENV || 'local';
  const ENV_PORT = process.env.PORT;
  const ENV_DATABASE_URL = process.env.DATABASE_URL;

  return {
    nodeEnv: ENV_NODE_ENV,
    port: ENV_PORT ? +ENV_PORT : 3000,
    databaseUrl: ENV_DATABASE_URL,
    isLocal: ENV_NODE_ENV === 'local',
    isDevelopment: ENV_NODE_ENV === 'development',
    isProduction: ENV_NODE_ENV === 'production',
    isTest: ENV_NODE_ENV === 'test',
  };
};
