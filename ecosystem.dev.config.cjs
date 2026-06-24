module.exports = {
  apps: [
    {
      name: 'fleet-frontend-dev',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      interpreter: 'node',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env_development: {
        NODE_ENV: 'development',
        PORT: 6009,
      },
    },
  ],
};
