const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "secretkey";
const authMiddleware = require("../middleware/authMiddleware");

const buildUserPayload = (user) => {
  try {
    const payload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    // Include student info and bus for parents
    if (user.studentId) {
      const studentId = user.studentId._id || user.studentId;
      payload.student = {
        id: studentId,
        name: user.studentId?.name || 'Unknown',
        email: user.studentId?.email || ''
      };
      
      // Include bus info for parents so they can track
      if (user.studentId?.busId) {
        const busId = user.studentId.busId._id || user.studentId.busId;
        payload.bus = {
          id: busId,
          busNumber: user.studentId.busId?.busNumber || 'N/A',
          route: user.studentId.busId?.route || 'N/A',
          driver: user.studentId.busId?.driver || { name: 'N/A', phone: 'N/A' },
          incharge: user.studentId.busId?.incharge || { name: 'N/A', phone: 'N/A' }
        };
      }
    }

    // Include bus info for students
    if (user.busId && user.role === 'student') {
      const busId = user.busId._id || user.busId;
      payload.bus = {
        id: busId,
        busNumber: user.busId?.busNumber || 'N/A',
        route: user.busId?.route || 'N/A',
        driver: user.busId?.driver || { name: 'N/A', phone: 'N/A' },
        incharge: user.busId?.incharge || { name: 'N/A', phone: 'N/A' }
      };
    }

    return payload;
  } catch (error) {
    console.error('Error building user payload:', error);
    // Return minimal payload on error
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
  }
};

const generateParentPassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let password = "Parent";

  for (let i = 0; i < 6; i += 1) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  return password;
};

const requireAdmin = (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return false;
  }

  return true;
};


// ✅ REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashed
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET);

    res.json({
      token,
      user: buildUserPayload(user)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Wrong password" });

    // Populate for students
    if (user.role === 'student' && user.busId) {
      try {
        user = await user.populate('busId', 'busNumber route location driver incharge');
      } catch (populateErr) {
        console.error('Error populating bus for student:', populateErr);
      }
    }

    // Populate for parents
    if (user.role === 'parent' && user.studentId) {
      try {
        // First populate the student reference
        user = await user.populate({
          path: 'studentId',
          select: 'name email busId',
          populate: {
            path: 'busId',
            select: 'busNumber route location driver incharge'
          }
        });
      } catch (populateErr) {
        console.error('Error populating student/bus for parent:', populateErr);
        // Continue without bus data rather than failing
      }
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET);

    res.json({
      token,
      user: buildUserPayload(user)
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

// ✅ VERIFY TOKEN
router.get("/verify", async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "No token provided" });

    const verified = jwt.verify(token, JWT_SECRET);
    let user = await User.findById(verified.id);
    
    if (!user) return res.status(404).json({ message: "User not found" });

    // Populate for students
    if (user.role === 'student' && user.busId) {
      try {
        user = await user.populate('busId', 'busNumber route location driver incharge');
      } catch (populateErr) {
        console.error('Error populating bus for student:', populateErr);
      }
    }

    // Populate for parents
    if (user.role === 'parent' && user.studentId) {
      try {
        user = await user.populate({
          path: 'studentId',
          select: 'name email busId',
          populate: {
            path: 'busId',
            select: 'busNumber route location driver incharge'
          }
        });
      } catch (populateErr) {
        console.error('Error populating student/bus for parent:', populateErr);
        // Continue without bus data rather than failing
      }
    }

    res.json({
      user: buildUserPayload(user)
    });
  } catch (err) {
    console.error('Verify token error:', err);
    res.status(401).json({ message: "Invalid token" });
  }
});

router.get("/students", authMiddleware, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const students = await User.find({ role: "student" })
      .select("name email busId")
      .populate("busId", "busNumber route")
      .sort({ name: 1 });

    const parents = await User.find({ role: "parent" })
      .select("name email studentId")
      .sort({ name: 1 });

    res.json({
      students: students.map((student) => ({
        id: student._id,
        name: student.name,
        email: student.email,
        bus: student.busId ? {
          id: student.busId._id,
          busNumber: student.busId.busNumber,
          route: student.busId.route
        } : null,
        parents: parents
          .filter((parent) => parent.studentId?.toString() === student._id.toString())
          .map((parent) => ({
            id: parent._id,
            name: parent.name,
            email: parent.email
          }))
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/parents", authMiddleware, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { studentId, name, email, password, resetPassword } = req.body;

    if (!studentId || !name || !email) {
      return res.status(400).json({ message: "Student, parent name, and parent email are required" });
    }

    const student = await User.findOne({ _id: studentId, role: "student" });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const plainPassword = password || generateParentPassword();
    const hashed = await bcrypt.hash(plainPassword, 10);
    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.role !== "parent") {
      return res.status(400).json({ message: "This email is already used by another account" });
    }

    let parent = existingUser;
    const shouldSetPassword = !parent || resetPassword || password;

    if (parent) {
      parent.name = name;
      parent.studentId = student._id;

      if (shouldSetPassword) {
        parent.password = hashed;
      }
    } else {
      parent = new User({
        name,
        email,
        password: hashed,
        role: "parent",
        studentId: student._id
      });
    }

    await parent.save();

    res.json({
      message: existingUser ? "Parent account updated" : "Parent account created",
      parent: {
        id: parent._id,
        name: parent.name,
        email: parent.email,
        password: shouldSetPassword ? plainPassword : null,
        student: {
          id: student._id,
          name: student.name,
          email: student.email
        }
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
