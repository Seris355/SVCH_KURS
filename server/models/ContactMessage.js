const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContactMessage = sequelize.define('ContactMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  threadId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'contact_threads', key: 'id' },
    onDelete: 'CASCADE',
  },
  senderRole: {
    type: DataTypes.ENUM('participant', 'admin'),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Сообщение не может быть пустым',
      },
    },
  },
  readByAdmin: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  readByParticipant: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'contact_messages',
  timestamps: true,
  updatedAt: false,
});

module.exports = ContactMessage;
