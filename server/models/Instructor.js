const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const customValidators = {
  isValidFullName(value) {
    if (!value) return;

    const nameRegex = /^[а-яА-ЯёЁa-zA-Z\s\-]+$/;
    if (!nameRegex.test(value)) {
      throw new Error('ФИО может содержать только буквы, пробелы и дефисы');
    }

    const parts = value.trim().split(/\s+/);
    if (parts.length < 2) {
      throw new Error('ФИО должно содержать минимум имя и фамилию');
    }
  },

  isValidSpecialization(value) {
    if (!value) return;

    const specRegex = /^[а-яА-ЯёЁa-zA-Z\s\-\(\)]+$/;
    if (!specRegex.test(value)) {
      throw new Error('Специализация может содержать только буквы, пробелы, дефисы и круглые скобки');
    }
  }
};

const Instructor = sequelize.define('Instructor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'ФИО не может быть пустым',
      },
      len: {
        args: [2, 100],
        msg: 'ФИО должно содержать от 2 до 100 символов',
      },
      isValidFullName: customValidators.isValidFullName,
    },
  },
  specialization: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Специализация не может быть пустой',
      },
      len: {
        args: [2, 200],
        msg: 'Специализация должна содержать от 2 до 200 символов',
      },
      isValidSpecialization: customValidators.isValidSpecialization,
    },
  },
}, {
  tableName: 'instructors',
  timestamps: false,
});

module.exports = Instructor;

