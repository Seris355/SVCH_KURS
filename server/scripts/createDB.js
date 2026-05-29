const path = require('path');
const { Client } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`В server/.env не задана переменная ${name}`);
  }
  return value;
}

async function createDatabase() {
  const dbName = requireEnv('DB_NAME');
  const client = new Client({
    host: requireEnv('DB_HOST'),
    port: Number(requireEnv('DB_PORT')),
    user: requireEnv('DB_USER'),
    password: requireEnv('DB_PASSWORD'),
    database: 'postgres',
  });

  await client.connect();

  const exists = await client.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [dbName]
  );

  if (exists.rowCount) {
    console.log(`База "${dbName}" уже существует.`);
  } else {
    await client.query(`CREATE DATABASE "${dbName}" ENCODING 'UTF8'`);
    console.log(`База "${dbName}" создана.`);
  }

  await client.end();
  console.log(
    'Дальше: npm run init-db (таблицы) или npm run seed-db (таблицы + тестовые данные).'
  );
}

createDatabase().catch((error) => {
  console.error('Ошибка при создании базы:', error.message);
  process.exit(1);
});
