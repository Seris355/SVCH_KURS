const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MasterClassCategory = sequelize.define('MasterClassCategory', {
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
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'categories', key: 'id' },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'master_class_categories',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['masterClassId', 'categoryId'],
    },
  ],
});

module.exports = MasterClassCategory;
