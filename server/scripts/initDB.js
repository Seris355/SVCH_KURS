const { sequelize } = require('../models');

const TABLE_NAMES = [
  'instructors',
  'participants',
  'participant_passwords',
  'masterclasses',
  'master_class_participants',
  'categories',
  'master_class_categories',
  'locations',
  'schedules',
  'payments',
  'reviews',
  'favorites',
  'refresh_tokens',
  'contact_requests',
  'contact_threads',
  'contact_messages',
  'tests',
  'questions',
  'answers',
  'test_results',
];

async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Подключение к базе данных установлено.');

    await sequelize.sync({ alter: true });
    console.log('Модели синхронизированы с базой данных.');
    console.log('Созданы/обновлены таблицы:');
    TABLE_NAMES.forEach((name) => console.log(`  - ${name}`));

    console.log('База данных успешно инициализирована!');
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    process.exit(1);
  }
}

initDatabase();
