module.exports = {
  apps: [
    {
      name: 'fleet-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      interpreter: 'node',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env_production: {
        NODE_ENV: 'production',
        PORT: 6007,
      },
    },
  ],
};
