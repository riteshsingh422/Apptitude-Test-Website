const Question = require('../models/Question');
const TestSession = require('../models/TestSession');
const Student = require('../models/Student');

exports.startTest = async (req, res) => {
  const { code } = req.body;
  const student = await Student.findOne({ code });
  if (!student) return res.status(404).json({ message: 'Invalid code' });

  let session = await TestSession.findOne({ studentCode: code });
  if (session && session.status === 'completed') {
    return res.status(400).json({ message: 'Test already completed' });
  }

  if (session && session.status === 'in_progress') {
    return res.json({
      questions: session.questions,
      currentIndex: session.currentIndex || 0,
      remainingTime: session.remainingTime || 1800,
      answers: Object.fromEntries(session.answers || new Map())
    });
  }

  // 🔥 NEW LOGIC (ONLY CHANGE)
  const allStudents = await Student.find().sort({ code: 1 }).lean();
  const studentIndex = allStudents.findIndex(s => s.code === code);

  const aptitudeQuestions = await Question.find({ category: 'aptitude' }).lean();
  const reasoningQuestions = await Question.find({ category: 'reasoning' }).lean();
  const codingQuestions = await Question.find({ category: 'coding' }).lean();

  const aptitudeChunk = aptitudeQuestions.slice(studentIndex * 10, (studentIndex + 1) * 10);
  const reasoningChunk = reasoningQuestions.slice(studentIndex * 10, (studentIndex + 1) * 10);
  const codingChunk = codingQuestions.slice(studentIndex * 10, (studentIndex + 1) * 10);

  const selected = [...aptitudeChunk, ...reasoningChunk, ...codingChunk]
    .map(q => ({
      qId: q._id.toString(),
      question: q.question,
      options: q.options
    }))
    .sort(() => 0.5 - Math.random());

  session = new TestSession({
    studentCode: code,
    questions: selected, // now 30 questions
    status: 'in_progress',
    remainingTime: 1800,
    currentIndex: 0,
    answers: new Map(),
    score: 0
  });

  await session.save();
  res.json({
    questions: session.questions,
    currentIndex: 0,
    remainingTime: 1800,
    answers: {}
  });
};

exports.submitAnswer = async (req, res) => {
  const { code, questionIndex, selectedOption } = req.body;
  const session = await TestSession.findOne({ studentCode: code });
  if (!session) return res.status(404).json({ message: 'Session not found' });

  session.answers.set(questionIndex.toString(), selectedOption);
  session.currentIndex = Math.max(session.currentIndex, questionIndex + 1);
  session.lastUpdated = new Date();
  await session.save();
  res.json({ message: 'Answer saved' });
};

exports.updateTime = async (req, res) => {
  const { code, remainingTime } = req.body;
  const session = await TestSession.findOne({ studentCode: code });
  if (session) {
    session.remainingTime = remainingTime;
    session.lastUpdated = new Date();
    await session.save();
  }
  res.json({ success: true });
};

exports.submitTest = async (req, res) => {
  const { code } = req.body;
  try {
    const session = await TestSession.findOne({ studentCode: code });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    let correctCount = 0;
    const allQuestions = await Question.find();

    session.answers.forEach((selectedOption, qIndex) => {
      const questionIndex = parseInt(qIndex);
      if (session.questions[questionIndex]) {
        const qId = session.questions[questionIndex].qId;
        const actualQuestion = allQuestions.find(q => q._id.toString() === qId);

        if (actualQuestion) {
          const correctIndex = Number(actualQuestion.correctAnswer);
          const selectedIndex = Number(selectedOption);
          if (correctIndex === selectedIndex) {
            correctCount++;
          }
        }
      }
    });

    const scorePercentage = Math.round((correctCount / session.questions.length) * 100);

    session.status = 'completed';
    session.score = scorePercentage;
    session.lastUpdated = new Date();
    await session.save();

    console.log(`✅ Score saved for ${code}: ${scorePercentage}%`);
    res.json({ message: 'Test submitted successfully', score: scorePercentage });
  } catch (err) {
    res.status(500).json({ message: 'Error submitting test' });
  }
};