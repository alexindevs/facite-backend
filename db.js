const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const dbURL = process.env.DB_URL;

const sequelize = new Sequelize(dbURL, {
  dialect: 'postgres',
  logging: true,
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

module.exports = sequelize;
