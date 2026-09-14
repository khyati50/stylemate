const { DataTypes } = require("sequelize");
const db = require("../config/db");

const ChatInteractionLog = db.define("ChatInteractionLog", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  queryText: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  intent: {
    type: DataTypes.STRING,
    defaultValue: "outfit_recommendation",
  },
  parsedContext: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  modelUsed: {
    type: DataTypes.STRING,
    defaultValue: "gemini",
  },
  latencyMs: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  responseText: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  recommendedOutfit: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  feedback: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = ChatInteractionLog;
