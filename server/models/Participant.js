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

  isValidPhone(value) {
    if (!value) return;

    const phoneRegex = /^[\d\s\-\+\(\)\.]{10,}$/;
    if (!phoneRegex.test(value)) {
      throw new Error('Телефон должен содержать минимум 10 символов и может включать цифры, пробелы, дефисы, плюсы, скобки и точки');
    }
  }
};

const Participant = sequelize.define('Participant', {
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
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Некорректный формат email',
      },
      notEmpty: {
        msg: 'Email не может быть пустым',
      },
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Телефон не может быть пустым',
      },
      len: {
        args: [10, 50],
        msg: 'Телефон должен содержать от 10 до 50 символов',
      },
      isValidPhone: customValidators.isValidPhone,
    },
  },
}, {
  tableName: 'participants',
  timestamps: false,
});

module.exports = Participant;

