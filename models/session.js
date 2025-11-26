const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: String,
  name: String,
  grade: Number,
  educationLevel: String, // ✅ เพิ่มระดับการศึกษา
  abilitiesInputText: String,
  recommendations: [
    {
      rank: Number,
      faculty: String,
      major: String,
      requiredGrade: Number,
      abilities: [String],
      matchedAbilities: [String],
      majorDescription: String,
      quota: String,
      condition: String,
      studyDuration: String,
      acquiredSkills: String,
      tuitionFee: String,
      careers: [String],

      // เพิ่มข้อมูลใหม่
      studyPlan: [String],
      studyPlanPdf: String,
      studyPlanInfoImg: String,
      website: String,
      majorsFacebook: String,
      facultyFacebook: String,
      logoUrl: String //โลโก้
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
