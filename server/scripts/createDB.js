const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  const dbName = process.env.DB_NAME;
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
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
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`База "${dbName}" создана.`);
  }

  await client.end();
}

createDatabase().catch((error) => {
  console.error('Ошибка при создании базы:', error.message);
  process.exit(1);
});
