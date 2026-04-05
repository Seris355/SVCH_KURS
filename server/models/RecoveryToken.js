const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RecoveryToken = sequelize.define('RecoveryToken', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  participantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'participants',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'recovery_tokens',
  timestamps: false,
  indexes: [
    { fields: ['token'] },
    { fields: ['expiresAt'] },
  ],
});

module.exports = RecoveryToken;
