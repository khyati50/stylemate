const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { Op } = require("sequelize");
const TwinningSession = require("../models/TwinningSession");
const ClothingItem = require("../models/ClothingItem");
const User = require("../models/User");

const AI_DIR = path.resolve(__dirname, "../../ai");
const SCRIPT_PATH = path.join(AI_DIR, "twinning.py");
const VENV_PYTHON = path.join(AI_DIR, "venv/bin/python");
const PYTHON_CMD = fs.existsSync(VENV_PYTHON) ? VENV_PYTHON : "python3";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Generates a random 6-character unique session code.
 */
const generateUniqueSessionCode = async () => {
  let attempts = 0;
  while (attempts < 10) {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
    }
    const existing = await TwinningSession.findOne({ where: { sessionCode: code } });
    if (!existing) {
      return code;
    }
    attempts++;
  }
  throw new Error("Failed to generate a unique session code. Please try again.");
};

/**
 * Helper to normalize Python outfit slots to frontend slots.
 */
const normalizeOutfit = (raw) => {
  if (!raw) return null;
  return {
    top: raw.upper_body || null,
    bottom: raw.lower_body || null,
    fullBody: raw.full_body || null,
    footwear: raw.footwear || null,
    outerwear: raw.outerwear || null,
    accessory: Array.isArray(raw.accessories)
      ? raw.accessories[0] || null
      : raw.accessories || null,
  };
};

/**
 * Spawns the Python twinning pipeline and communicates via stdin/stdout.
 */
const runPythonTwinning = (inputData) => {
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
        reject(new Error(`Failed to parse Python twinning output: ${err.message}`));
      }
    });

    pythonProcess.on("error", (err) => {
      reject(new Error(`Failed to start Python twinning process: ${err.message}`));
    });

    pythonProcess.stdin.write(JSON.stringify(inputData));
    pythonProcess.stdin.end();
  });
};

/**
 * POST /api/twinning/create
 * Creates a new twinning session with initiator = req.user.id
 */
const createSession = async (req, res) => {
  try {
    const sessionCode = await generateUniqueSessionCode();
    const session = await TwinningSession.create({
      sessionCode,
      initiatorId: req.user.id,
      status: "waiting",
    });

    return res.status(201).json({
      success: true,
      sessionCode: session.sessionCode,
      sessionId: session.id,
      session,
    });
  } catch (error) {
    console.error("createSession error:", error);
    return res.status(500).json({
      message: error.message || "Failed to create twinning session",
    });
  }
};

/**
 * POST /api/twinning/join
 * Partner joins an existing waiting session using session code
 */
const joinSession = async (req, res) => {
  try {
    const { sessionCode, code } = req.body;
    const cleanCode = (sessionCode || code || "").toUpperCase().trim();

    if (!cleanCode) {
      return res.status(400).json({ message: "Session code is required" });
    }

    const session = await TwinningSession.findOne({
      where: { sessionCode: cleanCode },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found with that code" });
    }

    if (session.initiatorId === req.user.id) {
      return res.status(400).json({ message: "You cannot join your own session" });
    }

    // Already joined partner re-connecting
    if (session.partnerId === req.user.id) {
      return res.status(200).json({
        success: true,
        message: "Rejoined session",
        session,
      });
    }

    if (session.status !== "waiting" || session.partnerId !== null) {
      return res.status(400).json({
        message: "This session is already full or completed",
      });
    }

    session.partnerId = req.user.id;
    session.status = "active";
    await session.save();

    return res.status(200).json({
      success: true,
      message: "Joined session successfully",
      session,
    });
  } catch (error) {
    console.error("joinSession error:", error);
    return res.status(500).json({
      message: error.message || "Failed to join twinning session",
    });
  }
};

/**
 * POST /api/twinning/generate
 * Runs couple/friend twinning AI algorithm and saves coordinated outfits
 */
const generateTwinning = async (req, res) => {
  try {
    const sessionCode = (req.body.sessionCode || req.params.sessionCode || "").toUpperCase().trim();
    const occasion = req.body.occasion || "casual";
    const season = req.body.season || "summer";

    if (!sessionCode) {
      return res.status(400).json({ message: "Session code is required" });
    }

    const session = await TwinningSession.findOne({
      where: { sessionCode },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.initiatorId !== req.user.id && session.partnerId !== req.user.id) {
      return res.status(403).json({
        message: "You are not a participant in this twinning session",
      });
    }

    if (session.status !== "active" && session.status !== "completed") {
      return res.status(400).json({
        message: "Please wait for your partner to join the session before generating looks",
      });
    }

    // Fetch wardrobes for both participants
    const [wardrobeAModels, wardrobeBModels] = await Promise.all([
      ClothingItem.findAll({
        where: { userId: session.initiatorId, status: "available" },
      }),
      ClothingItem.findAll({
        where: { userId: session.partnerId, status: "available" },
      }),
    ]);

    const wardrobeA = wardrobeAModels.map((item) => item.toJSON());
    const wardrobeB = wardrobeBModels.map((item) => item.toJSON());

    if (wardrobeA.length === 0) {
      return res.status(400).json({
        message: "The session host does not have any available clothing items in their wardrobe.",
      });
    }

    if (wardrobeB.length === 0) {
      return res.status(400).json({
        message: "The partner does not have any available clothing items in their wardrobe.",
      });
    }

    const inputData = {
      wardrobe_a: wardrobeA,
      wardrobe_b: wardrobeB,
      weather: {
        season,
        temperature: req.body.temperature || 25,
        condition: req.body.condition || "sunny",
      },
      occasion,
      season,
    };

    const rawPairs = await runPythonTwinning(inputData);

    if (!rawPairs || rawPairs.length === 0) {
      return res.status(404).json({
        message: "No coordinated outfit pairs could be found for the selected occasion and season.",
      });
    }

    // Normalize outfits in pairs
    const normalizedPairs = rawPairs.map((p) => ({
      ...p,
      outfit_a: normalizeOutfit(p.outfit_a),
      outfit_b: normalizeOutfit(p.outfit_b),
    }));

    const topPair = normalizedPairs[0];

    session.initiatorOutfit = topPair.outfit_a;
    session.partnerOutfit = topPair.outfit_b;
    session.pairScore = topPair.pair_score;
    session.coordinationReason = topPair.coordination_reason;
    session.pairs = normalizedPairs;
    session.occasion = occasion;
    session.season = season;
    session.status = "completed";

    await session.save();

    return res.status(200).json({
      success: true,
      pairs: normalizedPairs,
      initiatorOutfit: session.initiatorOutfit,
      partnerOutfit: session.partnerOutfit,
      coordinationReason: session.coordinationReason,
      pairScore: session.pairScore,
      session,
    });
  } catch (error) {
    console.error("generateTwinning error:", error);
    return res.status(500).json({
      message: error.message || "Failed to generate coordinated outfits",
    });
  }
};

/**
 * GET /api/twinning/:sessionCode
 * Returns session state, user role, and participant usernames
 */
const getSessionByCode = async (req, res) => {
  try {
    const sessionCode = (req.params.sessionCode || "").toUpperCase().trim();

    const session = await TwinningSession.findOne({
      where: { sessionCode },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    let userRole = "viewer";
    if (req.user && req.user.id === session.initiatorId) {
      userRole = "initiator";
    } else if (req.user && req.user.id === session.partnerId) {
      userRole = "partner";
    }

    const initiator = await User.findByPk(session.initiatorId, {
      attributes: ["id", "username"],
    });

    const partner = session.partnerId
      ? await User.findByPk(session.partnerId, {
          attributes: ["id", "username"],
        })
      : null;

    return res.status(200).json({
      success: true,
      session,
      userRole,
      initiatorUsername: initiator ? initiator.username : "Host",
      partnerUsername: partner ? partner.username : null,
    });
  } catch (error) {
    console.error("getSessionByCode error:", error);
    return res.status(500).json({
      message: error.message || "Failed to retrieve session details",
    });
  }
};

/**
 * PATCH /api/twinning/:sessionCode/settings
 * Updates occasion and season for a session, and sets status back to 'active' if it was completed
 */
const updateSessionSettings = async (req, res) => {
  try {
    const sessionCode = (req.params.sessionCode || "").toUpperCase().trim();
    const { occasion, season, resetStatus } = req.body;

    const session = await TwinningSession.findOne({
      where: { sessionCode },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Verify user is either initiator or partner
    if (session.initiatorId !== req.user.id && session.partnerId !== req.user.id) {
      return res.status(403).json({ message: "You are not a participant in this session" });
    }

    if (occasion) session.occasion = occasion;
    if (season) session.season = season;
    if (resetStatus || session.status === "completed") {
      session.status = "active";
    }

    await session.save();

    return res.status(200).json({
      success: true,
      message: "Session settings updated successfully",
      session,
    });
  } catch (error) {
    console.error("updateSessionSettings error:", error);
    return res.status(500).json({
      message: error.message || "Failed to update session settings",
    });
  }
};


/**
 * GET /api/twinning/my-sessions
 * Returns all sessions where current user is initiator or partner
 */
const getMySessions = async (req, res) => {
  try {
    const sessions = await TwinningSession.findAll({
      where: {
        [Op.or]: [
          { initiatorId: req.user.id },
          { partnerId: req.user.id },
        ],
      },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error("getMySessions error:", error);
    return res.status(500).json({
      message: error.message || "Failed to retrieve your sessions",
    });
  }
};

/**
 * DELETE /api/twinning/:sessionCode
 * Deletes session if host, or leaves session if partner
 */
const deleteSession = async (req, res) => {
  try {
    const sessionCode = (req.params.sessionCode || "").toUpperCase().trim();

    const session = await TwinningSession.findOne({
      where: { sessionCode },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (req.user.id !== session.initiatorId && req.user.id !== session.partnerId) {
      return res.status(403).json({
        message: "You are not authorized to modify this session",
      });
    }

    if (req.user.id === session.initiatorId) {
      await session.destroy();
      return res.status(200).json({
        success: true,
        message: "Session deleted successfully",
      });
    }

    if (req.user.id === session.partnerId) {
      session.partnerId = null;
      if (session.status === "active") {
        session.status = "waiting";
      }
      await session.save();
      return res.status(200).json({
        success: true,
        message: "Left session successfully",
      });
    }
  } catch (error) {
    console.error("deleteSession error:", error);
    return res.status(500).json({
      message: error.message || "Failed to delete or leave session",
    });
  }
};

module.exports = {
  createSession,
  joinSession,
  generateTwinning,
  getSessionByCode,
  getMySessions,
  deleteSession,
  updateSessionSettings,
  normalizeOutfit,
};
