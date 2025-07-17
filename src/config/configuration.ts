export default () => {
  const ENV_NODE_ENV = process.env.NODE_ENV || 'local';
  const ENV_SERVER_PORT = process.env.SERVER_PORT;
  const ENV_DATABASE_URL = process.env.DATABASE_URL;

  return {
    nodeEnv: ENV_NODE_ENV,
    serverPort: ENV_SERVER_PORT ? +ENV_SERVER_PORT : 3000,
    databaseUrl: ENV_DATABASE_URL,
    isLocal: ENV_NODE_ENV === 'local',
    isDevelopment: ENV_NODE_ENV === 'development',
    isProduction: ENV_NODE_ENV === 'production',
    isTest: ENV_NODE_ENV === 'test',
  };
};
