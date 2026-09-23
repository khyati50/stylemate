const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "all field are required",
      });
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email: trimmedEmail }, { username: trimmedUsername }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.email === trimmedEmail
            ? "User with this email already exists"
            : "Username is already taken",
      });
    }

    const hashpassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: trimmedUsername,
      email: trimmedEmail,
      password: hashpassword,
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "registered successfully",
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "all fields are required",
      });
    }

    const trimmedIdentifier = email.trim();
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: trimmedIdentifier },
          { username: trimmedIdentifier },
        ],
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "No user found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "invalid credentials",
      });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "login successful",
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
module.exports = { registerUser, loginUser };
