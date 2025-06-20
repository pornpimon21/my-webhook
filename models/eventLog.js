// ✅ เพิ่ม Schema สำหรับเก็บ EventId เพื่อกันประมวลผลซ้ำ
const mongoose = require('mongoose'); // ✅ ต้องมีบรรทัดนี้

const eventLogSchema = new mongoose.Schema({
  eventId: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // ลบหลัง 24 ชั่วโมง
});

module.exports = mongoose.model('EventLog', eventLogSchema);
