// backend/controllers/adminController.js
const Student = require('../models/Student');
const TestSession = require('../models/TestSession');
const Question = require('../models/Question');
const jwt = require('jsonwebtoken');

exports.adminLogin = async (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
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
    res.json({ message: `✅ ${count} unique 4-digit codes generated successfully!` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate codes' });
  }
};

exports.getAllSessions = async (req, res) => {
  try {
    const students = await Student.find().lean();
    const sessions = await TestSession.find().lean();

    // Load all questions so we can compute correct answers per session
    const allQuestions = await Question.find().lean();
    const questionMap = {};
    allQuestions.forEach(q => { questionMap[q._id.toString()] = q; });

    const result = students.map(student => {
      const session = sessions.find(s => s.studentCode === student.code);
      if (!session) {
        return {
          studentCode: student.code,
          status: 'not_started',
          currentIndex: 0,
          remainingTime: 1800,
          questions: [],
          answers: {},
          score: 0
        };
      }

      // Build answers object and enrich questions with correctAnswer + category
      const answersObj = {};
      if (session.answers) {
        const entries = session.answers instanceof Map
          ? [...session.answers.entries()]
          : Object.entries(session.answers);
        entries.forEach(([k, v]) => { answersObj[k] = v; });
      }

      // Enrich each question with correctAnswer and category from DB
      const enrichedQuestions = (session.questions || []).map(q => {
        const dbQ = questionMap[q.qId];
        return {
          ...q,
          correctAnswer: dbQ ? dbQ.correctAnswer : null,
          category: dbQ ? dbQ.category : 'aptitude'
        };
      });

      return {
        studentCode: student.code,
        status: session.status,
        currentIndex: session.currentIndex || 0,
        remainingTime: session.remainingTime || 1800,
        questions: enrichedQuestions,
        answers: answersObj,
        score: session.score || 0
      };
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load data' });
  }
};

// FIXED: Full restart — clears answers, resets timer, picks new questions
exports.restartSession = async (req, res) => {
  const { studentCode } = req.body;
  try {
    const allQuestions = await Question.find();
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 20).map(q => ({
      qId: q._id.toString(),
      question: q.question,
      options: q.options
    }));

    let session = await TestSession.findOne({ studentCode });
    if (!session) {
      session = new TestSession({ studentCode });
    }

    session.status = 'in_progress';
    session.score = 0;
    session.currentIndex = 0;
    session.remainingTime = 1800;
    session.answers = new Map();
    session.questions = selected;
    session.lastUpdated = new Date();

    await session.save();
    res.json({ message: `Test restarted for ${studentCode}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to restart' });
  }
};

// NEW: Assign codes to students from Excel data
// Call this after generating codes + uploading the Excel
// POST /admin/assign-codes  body: { students: [{name, email, phone}] }
exports.assignCodesToStudents = async (req, res) => {
  try {
    const { students } = req.body; // array of { name, email, phone }
    const codes = await Student.find().lean();

    if (students.length > codes.length) {
      return res.status(400).json({
        message: `Not enough codes. Have ${codes.length}, need ${students.length}.`
      });
    }

    const updates = [];
    for (let i = 0; i < students.length; i++) {
      updates.push(
        Student.updateOne(
          { code: codes[i].code },
          { $set: { name: students[i].name, email: students[i].email, phone: students[i].phone } }
        )
      );
    }
    await Promise.all(updates);

    // Return the mapping so admin can download/see it
    const mapping = students.map((s, i) => ({ ...s, code: codes[i].code }));
    res.json({ message: '✅ Codes assigned successfully!', mapping });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to assign codes' });
  }
};