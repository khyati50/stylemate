const db = require("../config/db");
const User = require("./User");
const ClothingItem = require("./ClothingItem");
const OutfitHistory = require("./OutfitHistory");
const OutfitFeedback = require("./OutfitFeedback");
const UserPreferences = require("./UserPreferences");
const TwinningSession = require("./TwinningSession");
const ChatInteractionLog = require("./ChatInteractionLog");
const CapsuleTrip = require("./CapsuleTrip");

// User <-> ClothingItem (1:N)
User.hasMany(ClothingItem, { foreignKey: "userId", onDelete: "CASCADE" });
ClothingItem.belongsTo(User, { foreignKey: "userId" });

// User <-> OutfitHistory (1:N)
User.hasMany(OutfitHistory, { foreignKey: "userId", onDelete: "CASCADE" });
OutfitHistory.belongsTo(User, { foreignKey: "userId" });

// OutfitHistory <-> OutfitFeedback (1:N)
OutfitHistory.hasMany(OutfitFeedback, { foreignKey: "historyId", onDelete: "SET NULL" });
OutfitFeedback.belongsTo(OutfitHistory, { foreignKey: "historyId" });

// User <-> OutfitFeedback (1:N)
User.hasMany(OutfitFeedback, { foreignKey: "userId", onDelete: "CASCADE" });
OutfitFeedback.belongsTo(User, { foreignKey: "userId" });

// User <-> UserPreferences (1:1)
User.hasOne(UserPreferences, { foreignKey: "userId", onDelete: "CASCADE" });
UserPreferences.belongsTo(User, { foreignKey: "userId" });

// User <-> CapsuleTrip (1:N)
User.hasMany(CapsuleTrip, { foreignKey: "userId", onDelete: "CASCADE" });
CapsuleTrip.belongsTo(User, { foreignKey: "userId" });

// User <-> ChatInteractionLog (1:N)
User.hasMany(ChatInteractionLog, { foreignKey: "userId", onDelete: "CASCADE" });
ChatInteractionLog.belongsTo(User, { foreignKey: "userId" });

// User <-> TwinningSession (Initiator & Partner)
User.hasMany(TwinningSession, { foreignKey: "initiatorId", as: "initiatedTwinSessions", onDelete: "CASCADE" });
User.hasMany(TwinningSession, { foreignKey: "partnerId", as: "partnerTwinSessions", onDelete: "SET NULL" });
TwinningSession.belongsTo(User, { foreignKey: "initiatorId", as: "initiator" });
TwinningSession.belongsTo(User, { foreignKey: "partnerId", as: "partner" });

module.exports = {
  db,
  User,
  ClothingItem,
  OutfitHistory,
  OutfitFeedback,
  UserPreferences,
  TwinningSession,
  ChatInteractionLog,
  CapsuleTrip,
};
