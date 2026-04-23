const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContactRequest = sequelize.define('ContactRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Имя не может быть пустым' },
      len: { args: [2, 100], msg: 'Имя от 2 до 100 символов' },
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: { msg: 'Некорректный формат email' },
      notEmpty: { msg: 'Email не может быть пустым' },
    },
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Сообщение не может быть пустым' },
      len: { args: [10, 3000], msg: 'Сообщение от 10 до 3000 символов' },
    },
  },
  status: {
    type: DataTypes.ENUM('new', 'read', 'replied'),
    allowNull: false,
    defaultValue: 'new',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'contact_requests',
  timestamps: false,
});

module.exports = ContactRequest;
