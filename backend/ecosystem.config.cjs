module.exports = {
  apps: [
    {
      name: 'falar-backend',
      script: 'src/app.ts',
      interpreter: './node_modules/.bin/tsx',
      interpreter_args: '--env-file=.env',
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
