module.exports = {
  apps: [{
    name: 'player-backend',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // 自动重启配置
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    // 健康检查
    health_check_grace_period: 3000,
    // 监控配置
    monitoring: true
  }]
};
