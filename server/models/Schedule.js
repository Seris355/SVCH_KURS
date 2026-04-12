const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Schedule = sequelize.define('Schedule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  masterClassId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'masterclasses', key: 'id' },
    onDelete: 'CASCADE',
  },
  locationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'locations', key: 'id' },
    onDelete: 'RESTRICT',
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: { msg: 'Дата начала должна быть корректной датой' },
    },
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: { msg: 'Дата окончания должна быть корректной датой' },
      isAfterStart(value) {
        if (new Date(value) <= new Date(this.startDate)) {
          throw new Error('Дата окончания должна быть позже даты начала');
        }
      },
    },
  },
  maxParticipants: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [1], msg: 'Максимум участников должен быть не менее 1' },
      isInt: { msg: 'Максимум участников должен быть целым числом' },
    },
  },
}, {
  tableName: 'schedules',
  timestamps: false,
});

module.exports = Schedule;
