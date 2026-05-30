const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("stylemate_db", "root", "rootroot", {
  host: "localhost",
  dialect: "mysql",
});
module.exports = sequelize;
