const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const AI_DIR = path.resolve(__dirname, "../../ai");
const SCRIPT_PATH = path.join(AI_DIR, "recommendation.py");
const VENV_PYTHON = path.join(AI_DIR, "venv/bin/python");
const PYTHON_CMD = fs.existsSync(VENV_PYTHON) ? VENV_PYTHON : "python3";

/**
 * Spawns the Python recommendation pipeline and communicates via stdin/stdout.
 * @param {Object} inputData - { wardrobe, weather, user_preferences, user_history }
 * @returns {Promise<Array>} Ranked outfit recommendations from Python
 */
const runPythonRecommendation = (inputData) => {
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

module.exports = {
  runPythonRecommendation,
};
