module.exports = {
  apps: [
    {
      name: 'falar-backend',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'src/app.ts',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
