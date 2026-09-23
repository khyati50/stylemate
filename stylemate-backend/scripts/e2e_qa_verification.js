/**
 * StyleMate End-to-End QA & Verification Suite
 * Agent 3 (Tester / QA Verifier)
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const assert = require("assert");
const sequelize = require("../config/db");
const {
  User,
  ClothingItem,
  OutfitHistory,
  OutfitFeedback,
  UserPreferences,
  CapsuleTrip,
  ChatInteractionLog,
  TwinningSession,
} = require("../models");

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5000";

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: [],
};

function recordResult(testName, passed, details = {}, error = null) {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`\x1b[32m✔ PASS\x1b[0m: ${testName}`);
  } else {
    results.failed++;
    console.error(`\x1b[31m✖ FAIL\x1b[0m: ${testName}`);
    if (error) console.error("   Error details:", error.message || error);
  }
  results.tests.push({ testName, passed, details, error: error ? (error.message || String(error)) : null });
}

// ==========================================
// TEST 1: Direct MySQL Index Verification
// ==========================================
async function test1_mysqlIndexVerification() {
  console.log("\n=======================================================");
  console.log("TEST 1: Direct MySQL Index Verification (All 8 Tables)");
  console.log("=======================================================");

  const tables = [
    "Users",
    "ClothingItems",
    "OutfitHistories",
    "OutfitFeedbacks",
    "CapsuleTrips",
    "ChatInteractionLogs",
    "TwinningSessions",
    "UserPreferences",
  ];

  const indexMap = {};
  for (const table of tables) {
    const [rows] = await sequelize.query(`SHOW INDEX FROM \`${table}\``);
    indexMap[table] = rows;
  }

  // 1. Users assertions
  try {
    const userIndexes = indexMap["Users"];
    const uUsername = userIndexes.find((i) => i.Key_name === "idx_users_username");
    const uEmail = userIndexes.find((i) => i.Key_name === "idx_users_email");

    assert(uUsername, "Users table missing 'idx_users_username'");
    assert.strictEqual(uUsername.Non_unique, 0, "idx_users_username must be unique (Non_unique: 0)");
    assert(uEmail, "Users table missing 'idx_users_email'");
    assert.strictEqual(uEmail.Non_unique, 0, "idx_users_email must be unique (Non_unique: 0)");

    recordResult("Test 1.1: Users unique indexes (idx_users_username, idx_users_email)", true, {
      idx_users_username: { column: uUsername.Column_name, nonUnique: uUsername.Non_unique },
      idx_users_email: { column: uEmail.Column_name, nonUnique: uEmail.Non_unique },
    });
  } catch (err) {
    recordResult("Test 1.1: Users unique indexes", false, {}, err);
  }

  // 2. ClothingItems assertions
  try {
    const cIndexes = indexMap["ClothingItems"];
    const hasUserId = cIndexes.some((i) => i.Column_name === "userId");
    const hasCategory = cIndexes.some((i) => i.Column_name === "category");
    const hasStatus = cIndexes.some((i) => i.Column_name === "status");

    assert(hasUserId, "ClothingItems must have index on userId");
    assert(hasCategory, "ClothingItems must have index on category");
    assert(hasStatus, "ClothingItems must have index on status");

    const indexNames = [...new Set(cIndexes.map((i) => i.Key_name))];
    recordResult("Test 1.2: ClothingItems indexes on userId, category, status", true, {
      indexNames,
      columnsCovered: ["userId", "category", "status"],
    });
  } catch (err) {
    recordResult("Test 1.2: ClothingItems indexes", false, {}, err);
  }

  // 3. OutfitHistories assertions
  try {
    const hIndexes = indexMap["OutfitHistories"];
    const idxUserId = hIndexes.find((i) => i.Key_name === "idx_outfit_histories_user_id");
    const idxUserCreated = hIndexes.filter((i) => i.Key_name === "idx_outfit_histories_user_created");

    assert(idxUserId, "OutfitHistories missing 'idx_outfit_histories_user_id'");
    assert(idxUserCreated.length >= 2, "OutfitHistories missing compound 'idx_outfit_histories_user_created'");

    recordResult("Test 1.3: OutfitHistories indexes (idx_outfit_histories_user_id, idx_outfit_histories_user_created)", true, {
      idx_outfit_histories_user_id: idxUserId.Key_name,
      idx_outfit_histories_user_created_columns: idxUserCreated.map((i) => i.Column_name),
    });
  } catch (err) {
    recordResult("Test 1.3: OutfitHistories indexes", false, {}, err);
  }

  // 4. OutfitFeedbacks assertions
  try {
    const fIndexes = indexMap["OutfitFeedbacks"];
    const idxHistory = fIndexes.find((i) => i.Key_name === "idx_outfit_feedbacks_history_id");
    const idxUser = fIndexes.find((i) => i.Key_name === "idx_outfit_feedbacks_user_id");

    assert(idxHistory, "OutfitFeedbacks missing 'idx_outfit_feedbacks_history_id'");
    assert(idxUser, "OutfitFeedbacks missing 'idx_outfit_feedbacks_user_id'");

    recordResult("Test 1.4: OutfitFeedbacks indexes (idx_outfit_feedbacks_history_id, idx_outfit_feedbacks_user_id)", true, {
      idx_outfit_feedbacks_history_id: idxHistory.Key_name,
      idx_outfit_feedbacks_user_id: idxUser.Key_name,
    });
  } catch (err) {
    recordResult("Test 1.4: OutfitFeedbacks indexes", false, {}, err);
  }

  // 5. CapsuleTrips assertions
  try {
    const tIndexes = indexMap["CapsuleTrips"];
    const idxUser = tIndexes.find((i) => i.Key_name === "idx_capsule_trips_user_id");
    assert(idxUser, "CapsuleTrips missing 'idx_capsule_trips_user_id'");

    recordResult("Test 1.5: CapsuleTrips index (idx_capsule_trips_user_id)", true, {
      idx_capsule_trips_user_id: idxUser.Key_name,
    });
  } catch (err) {
    recordResult("Test 1.5: CapsuleTrips index", false, {}, err);
  }

  // 6. ChatInteractionLogs assertions
  try {
    const cIndexes = indexMap["ChatInteractionLogs"];
    const idxUser = cIndexes.find((i) => i.Key_name === "idx_chat_logs_user_id");
    assert(idxUser, "ChatInteractionLogs missing 'idx_chat_logs_user_id'");

    recordResult("Test 1.6: ChatInteractionLogs index (idx_chat_logs_user_id)", true, {
      idx_chat_logs_user_id: idxUser.Key_name,
    });
  } catch (err) {
    recordResult("Test 1.6: ChatInteractionLogs index", false, {}, err);
  }

  // 7. TwinningSessions assertions
  try {
    const sIndexes = indexMap["TwinningSessions"];
    const sessionCodeIdx = sIndexes.find((i) => i.Column_name === "sessionCode" && i.Non_unique === 0);
    const idxInitiator = sIndexes.find((i) => i.Key_name === "idx_twinning_initiator");
    const idxPartner = sIndexes.find((i) => i.Key_name === "idx_twinning_partner");

    assert(sessionCodeIdx, "TwinningSessions missing unique index on sessionCode");
    assert(idxInitiator, "TwinningSessions missing 'idx_twinning_initiator'");
    assert(idxPartner, "TwinningSessions missing 'idx_twinning_partner'");

    recordResult("Test 1.7: TwinningSessions indexes (sessionCode unique, idx_twinning_initiator, idx_twinning_partner)", true, {
      sessionCodeKey: sessionCodeIdx.Key_name,
      sessionCodeNonUnique: sessionCodeIdx.Non_unique,
      idx_twinning_initiator: idxInitiator.Key_name,
      idx_twinning_partner: idxPartner.Key_name,
    });
  } catch (err) {
    recordResult("Test 1.7: TwinningSessions indexes", false, {}, err);
  }

  // 8. UserPreferences assertions
  try {
    const pIndexes = indexMap["UserPreferences"];
    const userIdIdx = pIndexes.find((i) => i.Column_name === "userId");
    assert(userIdIdx, "UserPreferences missing index on userId");

    recordResult("Test 1.8: UserPreferences indexes (userId unique/indexed)", true, {
      userIdKey: userIdIdx.Key_name,
      userIdNonUnique: userIdIdx.Non_unique,
    });
  } catch (err) {
    recordResult("Test 1.8: UserPreferences indexes", false, {}, err);
  }
}

// ==========================================
// TEST 2: Active User Data Integrity Assertion
// ==========================================
async function test2_activeUserDataIntegrity() {
  console.log("\n=======================================================");
  console.log("TEST 2: Active User Data Integrity Assertion");
  console.log("=======================================================");

  try {
    const [users] = await sequelize.query("SELECT id, username, email FROM Users ORDER BY id ASC");
    const user7 = users.find((u) => u.id === 7);
    const user8 = users.find((u) => u.id === 8);
    const orphanUsers = users.filter((u) => [3, 4, 5, 6].includes(u.id));

    // Assert user 7
    assert(user7, "User 7 must exist in database");
    assert.strictEqual(user7.username, "khyati anand", "User 7 username must be 'khyati anand'");
    assert.strictEqual(user7.email, "khyatianand1134", "User 7 email must be 'khyatianand1134'");

    // Assert user 8
    assert(user8, "User 8 must exist in database");
    assert.strictEqual(user8.username, "test", "User 8 username must be 'test'");
    assert.strictEqual(user8.email, "test@gmail.com", "User 8 email must be 'test@gmail.com'");

    // Assert orphan users 3,4,5,6 removed
    assert.strictEqual(orphanUsers.length, 0, `Legacy orphan IDs [3, 4, 5, 6] must be removed. Found: ${JSON.stringify(orphanUsers)}`);

    // Count user 7 records
    const [cResult] = await sequelize.query("SELECT COUNT(*) as count FROM ClothingItems WHERE userId = 7");
    const [hResult] = await sequelize.query("SELECT COUNT(*) as count FROM OutfitHistories WHERE userId = 7");

    const clothingCount = Number(cResult[0].count);
    const historyCount = Number(hResult[0].count);

    assert.strictEqual(clothingCount, 31, `User 7 ClothingItems count must be 31, got ${clothingCount}`);
    assert.strictEqual(historyCount, 5, `User 7 OutfitHistories count must be 5, got ${historyCount}`);

    recordResult("Test 2: Active User Data Integrity Assertion", true, {
      user7: { id: user7.id, username: user7.username, email: user7.email },
      user8: { id: user8.id, username: user8.username, email: user8.email },
      orphanUsersRemoved: [3, 4, 5, 6],
      user7ClothingCount: clothingCount,
      user7OutfitHistoryCount: historyCount,
    });
  } catch (err) {
    recordResult("Test 2: Active User Data Integrity Assertion", false, {}, err);
  }
}

// ==========================================
// TEST 3: Unique Constraint Rejection Test
// ==========================================
async function test3_uniqueConstraintRejection() {
  console.log("\n=======================================================");
  console.log("TEST 3: Unique Constraint Rejection Test");
  console.log("=======================================================");

  // Test 3a: Duplicate Username rejection
  try {
    let rejected = false;
    let caughtError = null;

    try {
      await User.create({
        username: "khyati anand", // duplicate of User 7
        email: `unique_tester_${Date.now()}@example.com`,
        password: "hashedpassword123",
      });
    } catch (err) {
      rejected = true;
      caughtError = err;
    }

    assert(rejected, "Database allowed insertion of duplicate username 'khyati anand'");
    const isDup =
      caughtError.name === "SequelizeUniqueConstraintError" ||
      (caughtError.parent && caughtError.parent.code === "ER_DUP_ENTRY") ||
      (caughtError.original && caughtError.original.code === "ER_DUP_ENTRY");
    assert(isDup, `Expected ER_DUP_ENTRY / SequelizeUniqueConstraintError, got ${caughtError.name}`);

    recordResult("Test 3.1: Duplicate username 'khyati anand' rejection", true, {
      errorName: caughtError.name,
      parentCode: caughtError.parent ? caughtError.parent.code : caughtError.original ? caughtError.original.code : null,
      message: caughtError.original ? caughtError.original.message : caughtError.message,
    });
  } catch (err) {
    recordResult("Test 3.1: Duplicate username rejection", false, {}, err);
  }

  // Test 3b: Duplicate Email rejection
  try {
    let rejected = false;
    let caughtError = null;

    try {
      await User.create({
        username: `unique_tester_${Date.now()}`,
        email: "khyatianand1134", // duplicate of User 7
        password: "hashedpassword123",
      });
    } catch (err) {
      rejected = true;
      caughtError = err;
    }

    assert(rejected, "Database allowed insertion of duplicate email 'khyatianand1134'");
    const isDup =
      caughtError.name === "SequelizeUniqueConstraintError" ||
      (caughtError.parent && caughtError.parent.code === "ER_DUP_ENTRY") ||
      (caughtError.original && caughtError.original.code === "ER_DUP_ENTRY");
    assert(isDup, `Expected ER_DUP_ENTRY / SequelizeUniqueConstraintError, got ${caughtError.name}`);

    recordResult("Test 3.2: Duplicate email 'khyatianand1134' rejection", true, {
      errorName: caughtError.name,
      parentCode: caughtError.parent ? caughtError.parent.code : caughtError.original ? caughtError.original.code : null,
      message: caughtError.original ? caughtError.original.message : caughtError.message,
    });
  } catch (err) {
    recordResult("Test 3.2: Duplicate email rejection", false, {}, err);
  }
}

// ==========================================
// TEST 4: Sequelize Association & Eager Loading Query Test
// ==========================================
async function test4_sequelizeAssociationEagerLoading() {
  console.log("\n=======================================================");
  console.log("TEST 4: Sequelize Association & Eager Loading Query Test");
  console.log("=======================================================");

  try {
    let capturedSql = "";
    const user = await User.findOne({
      where: { id: 7 },
      include: [
        { model: ClothingItem },
        { model: OutfitHistory },
        { model: UserPreferences },
      ],
      logging: (sql) => {
        capturedSql = sql;
      },
    });

    assert(user, "User 7 query returned null");
    assert.strictEqual(user.id, 7, "User ID must be 7");
    assert(Array.isArray(user.ClothingItems), "ClothingItems must be loaded as an array");
    assert.strictEqual(user.ClothingItems.length, 31, `Expected 31 ClothingItems, got ${user.ClothingItems.length}`);
    assert(Array.isArray(user.OutfitHistories), "OutfitHistories must be loaded as an array");
    assert.strictEqual(user.OutfitHistories.length, 5, `Expected 5 OutfitHistories, got ${user.OutfitHistories.length}`);
    assert(user.UserPreference, "UserPreference must be loaded");
    assert(capturedSql.includes("JOIN"), "Query must perform SQL JOINs across associated tables");

    recordResult("Test 4: Sequelize Association & Eager Loading Query (User 7 + Items + History + Preferences)", true, {
      userId: user.id,
      username: user.username,
      clothingItemsCount: user.ClothingItems.length,
      outfitHistoriesCount: user.OutfitHistories.length,
      userPreferencesId: user.UserPreference.id,
      favoriteColors: user.UserPreference.favoriteColors,
      sqlHasJoin: capturedSql.includes("JOIN"),
      sqlSnippet: capturedSql.substring(0, 160) + "...",
    });
  } catch (err) {
    recordResult("Test 4: Sequelize Association & Eager Loading Query", false, {}, err);
  }
}

// ==========================================
// TEST 5: Live API Route Smoke Test
// ==========================================
async function test5_liveApiRouteSmokeTest() {
  console.log("\n=======================================================");
  console.log("TEST 5: Live API Route Smoke Test");
  console.log("=======================================================");

  let token = null;

  // 5.1 GET /
  try {
    const res = await fetch(`${BASE_URL}/`);
    assert.strictEqual(res.status, 200, `Expected 200 OK from GET /, got ${res.status}`);
    const text = await res.text();
    assert.strictEqual(text, "StyleMate backend is running", `Expected body 'StyleMate backend is running', got '${text}'`);

    recordResult("Test 5.1: GET / root health check", true, {
      statusCode: res.status,
      body: text,
    });
  } catch (err) {
    recordResult("Test 5.1: GET / root health check", false, {}, err);
  }

  // 5.2 POST /api/auth/login with user 7 credentials
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "khyatianand1134", password: "1234" }),
    });

    assert.strictEqual(res.status, 200, `Expected 200 OK from POST /api/auth/login, got ${res.status}`);
    const data = await res.json();
    assert(data.token, "Login response did not contain token");
    token = data.token;

    recordResult("Test 5.2: POST /api/auth/login with User 7 credentials", true, {
      statusCode: res.status,
      message: data.message,
      tokenSnippet: token.substring(0, 24) + "...",
    });
  } catch (err) {
    recordResult("Test 5.2: POST /api/auth/login", false, {}, err);
  }

  // 5.3 GET /api/clothing with token
  try {
    assert(token, "Skipping GET /api/clothing because token was not acquired in login step");
    const res = await fetch(`${BASE_URL}/api/clothing`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    assert.strictEqual(res.status, 200, `Expected 200 OK from GET /api/clothing, got ${res.status}`);
    const data = await res.json();
    const items = data.wardrobe || data.clothing || data;
    assert(Array.isArray(items), "Expected clothing items array in response");
    assert.strictEqual(items.length, 31, `Expected 31 clothing items returned, got ${items.length}`);

    recordResult("Test 5.3: GET /api/clothing authenticated with JWT token", true, {
      statusCode: res.status,
      message: data.message,
      clothingItemsCount: items.length,
      firstItemSample: items[0] ? { id: items[0].id, name: items[0].name, category: items[0].category } : null,
    });
  } catch (err) {
    recordResult("Test 5.3: GET /api/clothing authenticated", false, {}, err);
  }
}

// ==========================================
// MAIN RUNNER
// ==========================================
async function runAll() {
  const startTime = Date.now();
  console.log("Starting Independent QA Verifier Test Suite...");
  console.log(`Timestamp: ${new Date().toISOString()}`);

  try {
    await sequelize.authenticate();
    console.log("Connected to MySQL database.");

    await test1_mysqlIndexVerification();
    await test2_activeUserDataIntegrity();
    await test3_uniqueConstraintRejection();
    await test4_sequelizeAssociationEagerLoading();
    await test5_liveApiRouteSmokeTest();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("\n=======================================================");
    console.log("QA TEST SUMMARY");
    console.log("=======================================================");
    console.log(`Total Assertions/Tests: ${results.total}`);
    console.log(`Passed: \x1b[32m${results.passed}\x1b[0m`);
    console.log(`Failed: \x1b[31m${results.failed}\x1b[0m`);
    console.log(`Execution Time: ${duration}s`);
    console.log(`Verdict: ${results.failed === 0 ? "\x1b[32mALL TESTS PASSED - PRODUCTION READY\x1b[0m" : "\x1b[31mFAILURES DETECTED\x1b[0m"}`);
    console.log("=======================================================\n");

    if (results.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (fatal) {
    console.error("FATAL SUITE ERROR:", fatal);
    process.exit(1);
  }
}

if (require.main === module) {
  runAll();
}

module.exports = {
  runAll,
  results,
};
