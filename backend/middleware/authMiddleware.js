const jwt = require("jsonwebtoken");
const User = require("../models/User");
const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : authHeader;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const verified = jwt.verify(token, JWT_SECRET);
    let user = null;

    try {
      user = await User.findById(verified.id)
        .populate('busId')
        .populate('studentId');
    } catch (populateErr) {
      console.error('Error populating user data:', populateErr);
      // Try without population
      user = await User.findById(verified.id);
    }

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(401).json({ message: "Invalid token or authentication failed" });
  }
};

module.exports = authMiddleware;
