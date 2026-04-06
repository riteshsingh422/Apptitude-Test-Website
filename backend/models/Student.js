const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true, minlength: 4, maxlength: 4 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', studentSchema);