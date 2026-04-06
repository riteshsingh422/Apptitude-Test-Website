const mongoose = require('mongoose');
const Question = require('../models/Question');
const questions = require('../data/sampleQuestions.json');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    await Question.deleteMany({});
    await Question.insertMany(questions);
    console.log('✅ Questions seeded successfully!');
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });