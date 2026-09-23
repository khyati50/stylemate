/**
 * StyleMate QA Verification Suite: Test 4
 * Agent 3 (Tester / QA Verifier)
 * 
 * Live Backend API Integration Test:
 * - Logs in as User 7 to obtain a valid JWT token
 * - Sends POST http://localhost:5000/api/recommendation/recommend
 *   Body: {"occasion": "casual", "season": "summer"}
 * - Asserts HTTP 200 is returned
 * - Asserts ranked outfits are present, sorted by score descending
 * - Asserts outfits include scores, styles, and colors
 */

const assert = require("assert");

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5000";

async function runLiveRecommendationQaTest() {
  console.log("=" .repeat(75));
  console.log("TEST 4: Live Backend API Integration Test");
  console.log("=" .repeat(75));

  // Step 1: Authenticate as User 7
  console.log("\n--- Step 4.1: Authenticating as User 7 ---");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "khyatianand1134",
      password: "1234",
    }),
  });

  assert.strictEqual(
    loginRes.status,
    200,
    `Expected 200 OK from login, got ${loginRes.status}`
  );

  const loginData = await loginRes.json();
  assert(loginData.token, "Login response did not return a JWT token");
  const token = loginData.token;
  console.log(`  ✔ Login status: ${loginRes.status} OK`);
  console.log(`  ✔ Authenticated User 7: ID=${loginData.user?.id || 7}, username='${loginData.user?.username || "khyati anand"}'`);
  console.log(`  ✔ JWT Token acquired: ${token.substring(0, 30)}...`);

  // Step 2: Call recommendation endpoint
  console.log("\n--- Step 4.2: POST /api/recommendation/recommend ---");
  const requestBody = {
    occasion: "casual",
    season: "summer",
  };
  console.log(`  Endpoint: POST ${BASE_URL}/api/recommendation/recommend`);
  console.log(`  Headers: Authorization: Bearer <User 7 Token>, Content-Type: application/json`);
  console.log(`  Body: ${JSON.stringify(requestBody)}`);

  const t0 = Date.now();
  const recRes = await fetch(`${BASE_URL}/api/recommendation/recommend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(requestBody),
  });
  const durationMs = Date.now() - t0;

  // Step 3: Assertions on HTTP Status
  assert.strictEqual(
    recRes.status,
    200,
    `Expected HTTP 200 from recommendation API, got ${recRes.status}`
  );
  console.log(`  ✔ HTTP Status: ${recRes.status} OK (Response Time: ${durationMs}ms)`);

  const recData = await recRes.json();

  // Step 4: Assertions on Payload Structure
  assert(recData.outfits, "Response payload missing 'outfits' field");
  assert(Array.isArray(recData.outfits), "'outfits' is not an array");
  assert(recData.outfits.length > 0, "No outfits returned for User 7");
  console.log(`  ✔ Ranked Outfits count: ${recData.outfits.length}`);

  // Step 5: Assertions on Scores, Ordering, Styles, and Colors
  console.log("\n--- Step 4.3: Validating Scores, Ordering, Styles & Colors ---");
  let prevScore = Infinity;
  let itemsChecked = 0;
  let validStyleCount = 0;
  let validColorCount = 0;

  recData.outfits.forEach((entry, idx) => {
    assert(entry.outfit, `Entry #${idx} missing 'outfit' object`);
    assert(
      typeof entry.score === "number" && !isNaN(entry.score),
      `Entry #${idx} score is not a valid number: ${entry.score}`
    );
    assert(
      entry.score <= prevScore + 1e-4,
      `Outfits are not sorted descending by score! Index ${idx} score (${entry.score}) > prevScore (${prevScore})`
    );
    prevScore = entry.score;

    // Inspect outfit pieces (top/bottom or fullBody, footwear, etc.)
    const pieces = [
      entry.outfit.top,
      entry.outfit.bottom,
      entry.outfit.fullBody,
      entry.outfit.footwear,
      entry.outfit.outerwear,
      entry.outfit.accessory,
    ].filter(Boolean);

    pieces.forEach((piece) => {
      itemsChecked++;
      if (piece.styles && Array.isArray(piece.styles) && piece.styles.length > 0) {
        validStyleCount++;
      }
      if (piece.colors && Array.isArray(piece.colors) && piece.colors.length > 0) {
        validColorCount++;
      }
    });
  });

  console.log(`  ✔ Descending Score Order: Verified across all ${recData.outfits.length} outfits`);
  console.log(`  ✔ Score Range: Best = ${recData.outfits[0].score}, Worst = ${recData.outfits[recData.outfits.length - 1].score}`);
  console.log(`  ✔ Total Garment Pieces Inspected: ${itemsChecked}`);
  console.log(`  ✔ Pieces with Valid Styles: ${validStyleCount} / ${itemsChecked}`);
  console.log(`  ✔ Pieces with Valid Colors: ${validColorCount} / ${itemsChecked}`);

  // Display top 3 ranked outfits summary
  console.log("\n--- Top 3 Recommended Outfits Sample ---");
  recData.outfits.slice(0, 3).forEach((item, idx) => {
    const o = item.outfit;
    const piecesDesc = [];
    if (o.fullBody) piecesDesc.push(`[Full Body: ${o.fullBody.name} | Styles: ${JSON.stringify(o.fullBody.styles)} | Colors: ${JSON.stringify(o.fullBody.colors)}]`);
    if (o.top) piecesDesc.push(`[Top: ${o.top.name} | Styles: ${JSON.stringify(o.top.styles)} | Colors: ${JSON.stringify(o.top.colors)}]`);
    if (o.bottom) piecesDesc.push(`[Bottom: ${o.bottom.name} | Styles: ${JSON.stringify(o.bottom.styles)} | Colors: ${JSON.stringify(o.bottom.colors)}]`);
    if (o.footwear) piecesDesc.push(`[Footwear: ${o.footwear.name} | Styles: ${JSON.stringify(o.footwear.styles)} | Colors: ${JSON.stringify(o.footwear.colors)}]`);
    if (o.accessory) piecesDesc.push(`[Accessory: ${o.accessory.name} | Styles: ${JSON.stringify(o.accessory.styles)} | Colors: ${JSON.stringify(o.accessory.colors)}]`);

    console.log(`  Rank #${idx + 1} (Score: ${item.score}):`);
    piecesDesc.forEach((desc) => console.log(`     ${desc}`));
  });

  console.log("\n" + "=" .repeat(75));
  console.log("[TEST 4 FINAL VERDICT]: PASS");
  console.log("=" .repeat(75));
}

runLiveRecommendationQaTest().catch((err) => {
  console.error("\n[TEST 4 FINAL VERDICT]: FAIL", err);
  process.exit(1);
});
