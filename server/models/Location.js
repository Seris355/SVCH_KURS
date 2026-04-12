const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Location = sequelize.define('Location', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Название места не может быть пустым' },
      len: { args: [2, 200], msg: 'Название места от 2 до 200 символов' },
    },
  },
  address: {
    type: DataTypes.STRING(300),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Адрес не может быть пустым' },
    },
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [1], msg: 'Вместимость должна быть не менее 1' },
      isInt: { msg: 'Вместимость должна быть целым числом' },
    },
  },
}, {
  tableName: 'locations',
  timestamps: false,
});

module.exports = Location;
