const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  participantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'participants', key: 'id' },
    onDelete: 'CASCADE',
  },
  scheduleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'schedules', key: 'id' },
    onDelete: 'CASCADE',
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Сумма не может быть отрицательной' },
      isDecimal: { msg: 'Сумма должна быть числом' },
    },
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'payments',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['participantId', 'scheduleId'],
      name: 'payments_participant_schedule_unique',
    },
  ],
});

module.exports = Payment;
