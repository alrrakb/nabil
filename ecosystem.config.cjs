const APP_ROOT = '/var/www/nabil';
const API_ROOT = `${APP_ROOT}/artifacts/api-server`;

module.exports = {
  apps: [
    // ─────────────────────────────────────────────
    // 1. API Server  (Express + keep-alive مدمج)
    // ─────────────────────────────────────────────
    {
      name: 'nabil-api',
      script: './dist/index.mjs',
      interpreter: 'node',
      node_args: `--enable-source-maps --env-file=${API_ROOT}/.env`,
      cwd: API_ROOT,

      instances: 1,
      autorestart: true,
      watch: false,

      // Memory / stability
      max_memory_restart: '512M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 3000,
      kill_timeout: 5000,

      // Logging
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      out_file: '/var/log/pm2/nabil-api.out.log',
      error_file: '/var/log/pm2/nabil-api.error.log',
      log_file: '/var/log/pm2/nabil-api.combined.log',

      env: {
        NODE_ENV: 'production',
        PORT: '8081',
      },
    },
  ],
};
