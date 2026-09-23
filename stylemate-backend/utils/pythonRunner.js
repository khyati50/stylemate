const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const AI_DIR = path.resolve(__dirname, "../../ai");
const VENV_PYTHON = path.join(AI_DIR, "venv/bin/python");
const PYTHON_CMD = fs.existsSync(VENV_PYTHON) ? VENV_PYTHON : "python3";
const DEFAULT_TIMEOUT_MS = 30_000; // 30 seconds

/**
 * Universal runner to execute any Python script in the ai/ directory.
 * Includes timeout protection (SIGKILL), EPIPE error handling, and clean JSON parsing.
 *
 * @param {Object} options
 * @param {string} options.scriptName - e.g. "recommendation.py", "gap_analysis.py", "twinning.py", "image_analyzer.py"
 * @param {Object} [options.inputData] - JSON serializable object sent via stdin
 * @param {Array<string>} [options.args] - Command line arguments passed to the script
 * @param {number} [options.timeoutMs] - Maximum execution time in milliseconds (default: 30000)
 * @returns {Promise<any>} Parsed JSON output from Python stdout
 */
const runPythonScript = ({ scriptName, inputData = null, args = [], timeoutMs = DEFAULT_TIMEOUT_MS }) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(AI_DIR, scriptName);
    const cmdArgs = [scriptPath, ...args];

    const pythonProcess = spawn(PYTHON_CMD, cmdArgs, {
      cwd: AI_DIR,
      env: { ...process.env },
    });

    let stdoutData = "";
    let stderrData = "";
    let settled = false;

    // Timeout guard
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        pythonProcess.kill("SIGKILL");
        reject(
          new Error(
            `Python script '${scriptName}' timed out after ${timeoutMs / 1000}s`
          )
        );
      }
    }, timeoutMs);

    pythonProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    // Guard against unhandled EPIPE if child process exits early
    pythonProcess.stdin.on("error", (err) => {
      if (!settled) {
        console.warn(`[pythonRunner] stdin warning for ${scriptName}:`, err.message);
      }
    });

    pythonProcess.on("close", (code) => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;

      if (code !== 0) {
        let errorMessage = `Python script '${scriptName}' exited with code ${code}`;
        try {
          if (stdoutData.trim()) {
            const parsedError = JSON.parse(stdoutData.trim());
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
        const result = JSON.parse(stdoutData.trim());
        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to parse output from '${scriptName}': ${err.message}`));
      }
    });

    pythonProcess.on("error", (err) => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      reject(new Error(`Failed to start Python script '${scriptName}': ${err.message}`));
    });

    // Write input to stdin if provided
    if (inputData !== null && inputData !== undefined) {
      try {
        pythonProcess.stdin.write(JSON.stringify(inputData));
        pythonProcess.stdin.end();
      } catch (err) {
        clearTimeout(timer);
        if (!settled) {
          settled = true;
          pythonProcess.kill("SIGKILL");
          reject(new Error(`Failed to write to stdin for '${scriptName}': ${err.message}`));
        }
      }
    } else {
      pythonProcess.stdin.end();
    }
  });
};

/**
 * Backward compatibility alias for recommendationController
 */
const runPythonRecommendation = (inputData) => {
  return runPythonScript({
    scriptName: "recommendation.py",
    inputData,
  });
};

module.exports = {
  runPythonScript,
  runPythonRecommendation,
};
