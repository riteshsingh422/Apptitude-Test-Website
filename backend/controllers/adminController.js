// backend/controllers/adminController.js
const Student = require('../models/Student');
const TestSession = require('../models/TestSession');
const jwt = require('jsonwebtoken');

exports.adminLogin = async (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "Insabhi@2026") {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.json({ token, message: 'Login successful' });
  }
  res.status(401).json({ message: 'Invalid credentials' });
};

exports.generateStudents = async (req, res) => {
  try {
    const count = 100;

    await Student.deleteMany({});
    await TestSession.deleteMany({});

    const students = [];
    const usedCodes = new Set();

    for (let i = 0; i < count; i++) {
      let code;
      do {
        code = String(1000 + Math.floor(Math.random() * 9000));
      } while (usedCodes.has(code));

      usedCodes.add(code);
      students.push({ code });
    }

    await Student.insertMany(students);

    res.json({
      message: `✅ ${count} unique 4-digit codes generated successfully!`
    });

  } catch (error) {
    console.error("Generate error:", error);
    res.status(500).json({ message: 'Failed to generate codes' });
  }
};

exports.getAllSessions = async (req, res) => {
  try {
    const students = await Student.find().lean();
    const sessions = await TestSession.find().lean();

    const result = students.map(student => {
      const session = sessions.find(s => s.studentCode === student.code);
      return {
        studentCode: student.code,
        status: session ? session.status : 'not_started',
        currentIndex: session ? session.currentIndex || 0 : 0,
        remainingTime: session ? session.remainingTime || 1800 : 1800,
        questions: session ? session.questions : [],
        score: session ? session.score : 0
      };
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load data' });
  }
};

exports.restartSession = async (req, res) => {
  const { studentCode } = req.body;
  try {
    let session = await TestSession.findOne({ studentCode });

    if (!session) {
      session = new TestSession({
        studentCode,
        status: 'in_progress',
        remainingTime: 1800,
        currentIndex: 0,
        answers: new Map()
      });
    } else {
      session.status = 'in_progress';
      session.remainingTime = session.remainingTime || 1800;
      session.currentIndex = session.currentIndex || 0;
    }

    session.lastUpdated = new Date();
    await session.save();

    res.json({ message: `Test restarted for ${studentCode}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to restart' });
  }
};