const mongoose = require('mongoose');

const testSessionSchema = new mongoose.Schema({
  studentCode: { type: String, unique: true, required: true },
  questions: [{
    qId: String,
    question: String,
    options: [String]
  }],
  currentIndex: { type: Number, default: 0 },
  answers: { type: Map, of: Number, default: () => new Map() }, 
  remainingTime: { type: Number, default: 1800 }, 
  status: { 
    type: String, 
    enum: ['not_started', 'in_progress', 'completed'], 
    default: 'not_started' 
  },
  score: { type: Number, default: 0 },
  startTime: Date,
  lastUpdated: { type: Date, default: Date.now },
  tabSwitchCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('TestSession', testSessionSchema);