const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: String,
  name: String,
  grade: Number,
  educationLevel: String, // ✅ เพิ่มระดับการศึกษา
  track: String,          // ✅ เพิ่มสายการเรียน (เช่น วิทย์-คณิต)
  abilitiesInputText: String,
  recommendations: [
    {
      rank: Number,
      faculty: String,
      major: String,
      requiredGrade: Number,
      abilities: [String],
      matchedAbilities: [String],
      quota: Number,
      condition: String,
      reason: String,
      careers: [String]
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
