// models/session.js
const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  sessionId: String,
  name: String,
  grade: Number,
  abilitiesInputText: String,
  recommendations: [
    {
      rank: Number,
      faculty: String,
      major: String,
      allAbilities: String,
      matchedAbilities: String,
      careers: [String] // ✅ เพิ่มตรงนี้ เพื่อเก็บอาชีพที่เกี่ยวข้องกับสาขา
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Session", sessionSchema);
