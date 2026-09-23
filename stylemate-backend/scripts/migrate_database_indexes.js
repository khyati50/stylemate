const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const sequelize = require("../config/db");

async function checkIndexExists(table, indexName) {
  try {
    const [indexes] = await sequelize.query(`SHOW INDEX FROM \`${table}\``);
    return indexes.some((row) => row.Key_name === indexName);
  } catch (error) {
    console.error(`Error checking indexes on table ${table}:`, error.message);
    throw error;
  }
}

async function addIndexIfNotExists(table, indexName, createIndexSql) {
  const exists = await checkIndexExists(table, indexName);
  if (exists) {
    console.log(`✓ Index "${indexName}" on table "${table}" already exists. Skipping.`);
  } else {
    console.log(`+ Creating index "${indexName}" on table "${table}"...`);
    await sequelize.query(createIndexSql);
    console.log(`✓ Index "${indexName}" created successfully.`);
  }
}

async function safeCleanupLegacyTestUsers() {
  console.log("\n--- Starting Safe Cleanup of Legacy Test Users ---");
  const [users] = await sequelize.query("SELECT id, username, email FROM Users ORDER BY id ASC");
  console.log("Current Users in database:", users);

  const candidateOrphanIds = [3, 4, 5, 6];
  const protectedUserIds = [7, 8];

  for (const id of candidateOrphanIds) {
    if (protectedUserIds.includes(id)) {
      console.warn(`WARNING: User ID ${id} is in the protected list! Skipping.`);
      continue;
    }

    const user = users.find((u) => u.id === id);
    if (!user) {
      console.log(`User ID ${id} not found in database or already deleted.`);
      continue;
    }

    // Safety checks across all related tables
    const [clothingCount] = await sequelize.query(
      `SELECT COUNT(*) as count FROM ClothingItems WHERE userId = :id`,
      { replacements: { id } }
    );
    const [historyCount] = await sequelize.query(
      `SELECT COUNT(*) as count FROM OutfitHistories WHERE userId = :id`,
      { replacements: { id } }
    );
    const [feedbackCount] = await sequelize.query(
      `SELECT COUNT(*) as count FROM OutfitFeedbacks WHERE userId = :id`,
      { replacements: { id } }
    );
    const [prefCount] = await sequelize.query(
      `SELECT COUNT(*) as count FROM UserPreferences WHERE userId = :id`,
      { replacements: { id } }
    );
    const [tripCount] = await sequelize.query(
      `SELECT COUNT(*) as count FROM CapsuleTrips WHERE userId = :id`,
      { replacements: { id } }
    );
    const [logCount] = await sequelize.query(
      `SELECT COUNT(*) as count FROM ChatInteractionLogs WHERE userId = :id`,
      { replacements: { id } }
    );
    const [twinningCount] = await sequelize.query(
      `SELECT COUNT(*) as count FROM TwinningSessions WHERE initiatorId = :id OR partnerId = :id`,
      { replacements: { id } }
    );

    const totalRecords =
      clothingCount[0].count +
      historyCount[0].count +
      feedbackCount[0].count +
      prefCount[0].count +
      tripCount[0].count +
      logCount[0].count +
      twinningCount[0].count;

    if (totalRecords === 0) {
      console.log(
        `Safely deleting orphan user ID ${id} (${user.username}, ${user.email}) with 0 associated records...`
      );
      await sequelize.query(`DELETE FROM Users WHERE id = :id`, { replacements: { id } });
      console.log(`✓ Deleted orphan user ID ${id}.`);
    } else {
      console.warn(
        `CAUTION: User ID ${id} has ${totalRecords} associated records. Not deleting.`
      );
    }
  }

  // Verify protected users User 7 and User 8 remain intact
  const [postCleanupUsers] = await sequelize.query(
    "SELECT id, username, email FROM Users ORDER BY id ASC"
  );
  console.log("Users after cleanup:", postCleanupUsers);

  const user7 = postCleanupUsers.find((u) => u.id === 7);
  const user8 = postCleanupUsers.find((u) => u.id === 8);

  if (!user7 || !user8) {
    throw new Error(
      `CRITICAL ERROR: Protected user 7 or 8 was affected! User 7: ${Boolean(user7)}, User 8: ${Boolean(user8)}`
    );
  }
  console.log("✓ Verified: User 7 ('khyati anand') and User 8 ('test') are intact.");
}

async function migrateIndexes() {
  console.log("\n--- Starting Index Migration ---");

  // 1. Users
  console.log("\n[Table: Users]");
  await addIndexIfNotExists(
    "Users",
    "idx_users_username",
    "CREATE UNIQUE INDEX idx_users_username ON Users (username)"
  );
  await addIndexIfNotExists(
    "Users",
    "idx_users_email",
    "CREATE UNIQUE INDEX idx_users_email ON Users (email)"
  );

  // 2. ClothingItems - verify existing indexes
  console.log("\n[Table: ClothingItems]");
  const clothingIndexes = ["clothing_items_user_id", "clothing_items_user_id_category", "clothing_items_user_id_status"];
  for (const idx of clothingIndexes) {
    const exists = await checkIndexExists("ClothingItems", idx);
    console.log(`  Existing index "${idx}": ${exists ? "INTACT (✓)" : "MISSING"}`);
  }

  // 3. OutfitHistories
  console.log("\n[Table: OutfitHistories]");
  await addIndexIfNotExists(
    "OutfitHistories",
    "idx_outfit_histories_user_id",
    "CREATE INDEX idx_outfit_histories_user_id ON OutfitHistories (userId)"
  );
  await addIndexIfNotExists(
    "OutfitHistories",
    "idx_outfit_histories_user_created",
    "CREATE INDEX idx_outfit_histories_user_created ON OutfitHistories (userId, createdAt)"
  );

  // 4. OutfitFeedbacks
  console.log("\n[Table: OutfitFeedbacks]");
  await addIndexIfNotExists(
    "OutfitFeedbacks",
    "idx_outfit_feedbacks_history_id",
    "CREATE INDEX idx_outfit_feedbacks_history_id ON OutfitFeedbacks (historyId)"
  );
  await addIndexIfNotExists(
    "OutfitFeedbacks",
    "idx_outfit_feedbacks_user_id",
    "CREATE INDEX idx_outfit_feedbacks_user_id ON OutfitFeedbacks (userId)"
  );

  // 5. CapsuleTrips
  console.log("\n[Table: CapsuleTrips]");
  await addIndexIfNotExists(
    "CapsuleTrips",
    "idx_capsule_trips_user_id",
    "CREATE INDEX idx_capsule_trips_user_id ON CapsuleTrips (userId)"
  );

  // 6. ChatInteractionLogs
  console.log("\n[Table: ChatInteractionLogs]");
  await addIndexIfNotExists(
    "ChatInteractionLogs",
    "idx_chat_logs_user_id",
    "CREATE INDEX idx_chat_logs_user_id ON ChatInteractionLogs (userId)"
  );

  // 7. TwinningSessions
  console.log("\n[Table: TwinningSessions]");
  await addIndexIfNotExists(
    "TwinningSessions",
    "idx_twinning_initiator",
    "CREATE INDEX idx_twinning_initiator ON TwinningSessions (initiatorId)"
  );
  await addIndexIfNotExists(
    "TwinningSessions",
    "idx_twinning_partner",
    "CREATE INDEX idx_twinning_partner ON TwinningSessions (partnerId)"
  );

  console.log("\n✓ All database index migrations completed successfully.");
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log("Connected to MySQL database.");

    // Step A: Safe cleanup
    await safeCleanupLegacyTestUsers();

    // Step B: Index migration
    await migrateIndexes();

    console.log("\n=== Migration finished successfully ===");
    process.exit(0);
  } catch (error) {
    console.error("\nMigration failed with error:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  safeCleanupLegacyTestUsers,
  migrateIndexes,
};
