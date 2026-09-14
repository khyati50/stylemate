const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
require("dotenv").config();

const db = require("../config/db");
const ChatInteractionLog = require("../models/ChatInteractionLog");

/**
 * Estimates token count based on standard ~4 chars per token heuristic.
 */
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

async function exportTrainingData() {
  try {
    console.log("Connecting to database for dataset export...");
    await db.authenticate();

    const outputDir = path.join(__dirname, "../data");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const logs = await ChatInteractionLog.findAll({
      order: [["id", "ASC"]],
    });

    console.log(`Found ${logs.length} interaction logs to export.`);

    const nluFilePath = path.join(outputDir, "train_nlu.jsonl");
    const stylistFilePath = path.join(outputDir, "train_stylist.jsonl");
    const summaryFilePath = path.join(outputDir, "dataset_summary.json");

    const nluLines = [];
    const stylistLines = [];

    let nluCount = 0;
    let stylistCount = 0;
    let nluTokens = 0;
    let stylistTokens = 0;

    for (const log of logs) {
      const queryText = (log.queryText || "").trim();
      if (!queryText) continue;

      // 1. NLU dataset line
      let parsedJsonString = "{}";
      if (log.parsedContext) {
        parsedJsonString =
          typeof log.parsedContext === "string"
            ? log.parsedContext
            : JSON.stringify(log.parsedContext);
      }

      const nluItem = {
        messages: [
          {
            role: "system",
            content:
              "You are StyleMate's expert fashion intent parser. Extract structured occasion, season, style, color, and time_of_day as JSON.",
          },
          {
            role: "user",
            content: queryText,
          },
          {
            role: "assistant",
            content: parsedJsonString,
          },
        ],
      };

      const nluLine = JSON.stringify(nluItem);
      nluLines.push(nluLine);
      nluCount++;
      nluTokens +=
        estimateTokens(nluItem.messages[0].content) +
        estimateTokens(nluItem.messages[1].content) +
        estimateTokens(nluItem.messages[2].content);

      // 2. Stylist dataset line (only if responseText exists)
      const responseText = (log.responseText || "").trim();
      if (responseText) {
        const stylistItem = {
          messages: [
            {
              role: "system",
              content:
                "You are StyleMate's personal fashion stylist. Provide warm, expert styling advice and rationale.",
            },
            {
              role: "user",
              content: queryText,
            },
            {
              role: "assistant",
              content: responseText,
            },
          ],
        };

        const stylistLine = JSON.stringify(stylistItem);
        stylistLines.push(stylistLine);
        stylistCount++;
        stylistTokens +=
          estimateTokens(stylistItem.messages[0].content) +
          estimateTokens(stylistItem.messages[1].content) +
          estimateTokens(stylistItem.messages[2].content);
      }
    }

    fs.writeFileSync(nluFilePath, nluLines.join("\n") + "\n", "utf-8");
    fs.writeFileSync(stylistFilePath, stylistLines.join("\n") + "\n", "utf-8");

    const summary = {
      totalRecords: logs.length,
      nluSamples: nluCount,
      stylistSamples: stylistCount,
      splitSizes: {
        nlu: {
          train: Math.floor(nluCount * 0.8),
          validation: Math.floor(nluCount * 0.1),
          test: nluCount - Math.floor(nluCount * 0.8) - Math.floor(nluCount * 0.1),
        },
        stylist: {
          train: Math.floor(stylistCount * 0.8),
          validation: Math.floor(stylistCount * 0.1),
          test: stylistCount - Math.floor(stylistCount * 0.8) - Math.floor(stylistCount * 0.1),
        },
      },
      estimatedTokens: {
        nluTotal: nluTokens,
        stylistTotal: stylistTokens,
        grandTotal: nluTokens + stylistTokens,
      },
      exportedAt: new Date().toISOString(),
      files: {
        trainNluJsonl: nluFilePath,
        trainStylistJsonl: stylistFilePath,
        datasetSummaryJson: summaryFilePath,
      },
    };

    fs.writeFileSync(summaryFilePath, JSON.stringify(summary, null, 2), "utf-8");

    console.log("\n========================================");
    console.log("   TRAINING DATA EXPORT COMPLETE");
    console.log("========================================");
    console.log(`NLU Samples exported: ${nluCount} -> ${nluFilePath}`);
    console.log(`Stylist Samples exported: ${stylistCount} -> ${stylistFilePath}`);
    console.log(`Summary written -> ${summaryFilePath}`);
    console.log("Estimated Tokens:", JSON.stringify(summary.estimatedTokens, null, 2));
    console.log("Split Sizes:", JSON.stringify(summary.splitSizes, null, 2));
    console.log("========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Export training data error:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  exportTrainingData();
}

module.exports = { exportTrainingData };
