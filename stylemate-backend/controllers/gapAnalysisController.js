const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const ClothingItem = require("../models/ClothingItem");

const AI_DIR = path.resolve(__dirname, "../../ai");
const SCRIPT_PATH = path.join(AI_DIR, "gap_analysis.py");
const VENV_PYTHON = path.join(AI_DIR, "venv/bin/python");
const PYTHON_CMD = fs.existsSync(VENV_PYTHON) ? VENV_PYTHON : "python3";

// Module-level cache: results are valid for 1 hour per user
const cache = {};
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Spawns the Python gap analysis pipeline and communicates via stdin/stdout.
 * @param {Object} inputData - { wardrobe }
 * @returns {Promise<Object>} Gap analysis result from Python
 */
const runPythonGapAnalysis = (inputData) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(PYTHON_CMD, [SCRIPT_PATH], {
      cwd: AI_DIR,
    });

    let stdoutData = "";
    let stderrData = "";

    pythonProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    pythonProcess.on("close", (code) => {
      console.log("STDOUT:");
      console.log(stdoutData);

      console.log("STDERR:");
      console.log(stderrData);
      if (code !== 0) {
        let errorMessage = `Python process exited with code ${code}`;
        try {
          if (stdoutData.trim()) {
            const parsedError = JSON.parse(stdoutData);
            if (parsedError && parsedError.error) {
              errorMessage = parsedError.error;
            }
          }
        } catch (_) {
          if (stderrData.trim()) {
            errorMessage = stderrData.trim();
          }
        }
        return reject(new Error(errorMessage));
      }

      try {
        const result = JSON.parse(stdoutData);
        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to parse Python output: ${err.message}`));
      }
    });

    pythonProcess.on("error", (err) => {
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });

    pythonProcess.stdin.write(JSON.stringify(inputData));
    pythonProcess.stdin.end();
  });
};

const getGapAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const forceRefresh = req.query.refresh === "true";

    // Return cached result if valid and not forced to refresh
    if (!forceRefresh && cache[userId]) {
      const age = Date.now() - cache[userId].cachedAt;
      if (age < CACHE_TTL_MS) {
        return res.status(200).json({ ...cache[userId].result, cached: true });
      }
    }

    // Fetch ALL clothing items for this user (no status filter)
    const wardrobeModels = await ClothingItem.findAll({
      where: { userId },
    });

    const wardrobe = wardrobeModels.map((item) => item.toJSON());

    if (wardrobe.length === 0) {
      return res.status(404).json({
        message: "Your wardrobe is empty. Add some clothes first.",
      });
    }

    const result = await runPythonGapAnalysis({ wardrobe });

    // Store result in cache
    cache[userId] = { result, cachedAt: Date.now() };

    return res.status(200).json(result);
  } catch (error) {
    console.error("Gap Analysis AI Error:", error);

    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = { getGapAnalysis };
