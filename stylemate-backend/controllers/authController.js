const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({
      message: "all field are required",
    });
  }
  const hashpassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    username,
    email,
    password: hashpassword,
  });

  console.log("Creating user...");
  res.status(201).json({
    message: "registered successfully",
    user,
  });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      message: "all fields are required",
    });
  }

  const user = await User.findOne({
    where: { email },
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
};
module.exports = { registerUser, loginUser };
