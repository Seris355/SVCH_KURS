const { sequelize, Instructor, Participant, MasterClass, ParticipantPassword, RefreshToken, RecoveryToken } = require('../models');

async function initDatabase() {
  try {
    
    await sequelize.authenticate();
    console.log('Подключение к базе данных установлено.');

    await sequelize.sync({ alter: true });
    console.log('Модели синхронизированы с базой данных.');

    console.log('База данных успешно инициализирована!');
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    process.exit(1);
  }
}

initDatabase();

