const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./user');

const Category = sequelize.define('Category', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  color: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
},
{
  // Options
  tableName: 'categories',
  timestamps: false
});

// Define the association between User and Category
User.hasMany(Category, { foreignKey: 'user_id' });
Category.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Category;
