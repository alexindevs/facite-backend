const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./user');
const Category = require('./category');

const Task = sequelize.define('Task', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Category,
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed'),
    allowNull: false,
    defaultValue: 'pending',
  },
  created_at: {
    type: 'TIMESTAMP',
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    allowNull: false
  },
  updated_at: {
    type: 'TIMESTAMP',
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    allowNull: false
  },
  due_date: {
    type: DataTypes.BIGINT,
    allowNull: false,
  }
}, 
{
   // Options
   tableName: 'tasks',
   timestamps: false
});

// Define the association between Category and Task
Category.hasMany(Task, { foreignKey: 'category_id' });
Task.belongsTo(Category, { foreignKey: 'category_id' });

module.exports = Task;
