const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContactThread = sequelize.define('ContactThread', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  participantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: 'participants', key: 'id' },
    onDelete: 'CASCADE',
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'contact_threads',
  timestamps: true,
  updatedAt: false,
});

module.exports = ContactThread;
