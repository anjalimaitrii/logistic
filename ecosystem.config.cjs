module.exports = {
  apps: [
    {
      name: 'fleet-frontend',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      env_production: {
        NODE_ENV: 'production',
        PORT: 6007,
      },
    },
  ],
};
