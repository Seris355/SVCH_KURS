// Конфигурация аутентификации
module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRES_IN: '1h',
  REFRESH_EXPIRES_IN_DAYS: 7,
  RECOVERY_EXPIRES_IN_HOURS: 1,
};