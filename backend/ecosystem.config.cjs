module.exports = {
  apps: [
    {
      name: 'falar-backend',
      script: 'dist/app.js',
      node_args: '--env-file=.env',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 9000,
      },
    },
  ],
};
