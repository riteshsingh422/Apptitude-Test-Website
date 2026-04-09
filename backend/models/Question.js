const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true }, // 0 to 3
  category: { type: String, enum: ['aptitude', 'reasoning', 'coding'], default: 'aptitude' }
});

module.exports = mongoose.model('Question', questionSchema);