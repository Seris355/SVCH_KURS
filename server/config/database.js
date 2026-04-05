const { Sequelize } = require('sequelize');
require('dotenv').config(); //dotenv.config() загружает переменные из .env файла в глобальный объект process.env.

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
  }
);

module.exports = sequelize;

