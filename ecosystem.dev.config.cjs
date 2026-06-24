module.exports = {
  apps: [
    {
      name: 'fleet-frontend-dev',
      script: 'node_modules/.bin/next',
      args: 'start',
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
