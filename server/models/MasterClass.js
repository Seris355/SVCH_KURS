const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const customValidators = {
  isValidPrice(value) {
    if (value === null || value === undefined) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      throw new Error('Цена должна быть числом');
    }

    if (numValue <= 0) {
      throw new Error('Цена должна быть положительной');
    }

    if (!/^\d+(\.\d{1,2})?$/.test(value.toString())) {
      throw new Error('Цена может содержать максимум 2 знака после запятой');
    }
  },

  isValidParticipantIds(value) {
    if (!Array.isArray(value)) {
      throw new Error('participantIds должен быть массивом');
    }

    for (const id of value) {
      if (!Number.isInteger(id) || id <= 0) {
        throw new Error('Все ID участников должны быть положительными целыми числами');
      }
    }
  }
};

const MasterClass = sequelize.define('MasterClass', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Название не может быть пустым',
      },
      len: {
        args: [2, 200],
        msg: 'Название должно содержать от 2 до 200 символов',
      },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Описание не может быть пустым',
      },
      len: {
        args: [10, 5000],
        msg: 'Описание должно содержать от 10 до 5000 символов',
      },
    },
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'Цена должна быть числом',
      },
      min: {
        args: [0],
        msg: 'Цена не может быть отрицательной',
      },
      isValidPrice: customValidators.isValidPrice,
    },
  },
  photo: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'Фото должно быть валидным URL',
        args: {
          protocols: ['http', 'https'],
          require_protocol: false,
        },
      },
    },
  },
  instructorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'instructors',
      key: 'id',
    },
    validate: {
      notNull: {
        msg: 'ID инструктора обязателен',
      },
    },
  },
  participantIds: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: true,
    defaultValue: [],
    validate: {
      isValidParticipantIds: customValidators.isValidParticipantIds,
    },
  },
}, {
  tableName: 'masterclasses',
  timestamps: false,
});

module.exports = MasterClass;

