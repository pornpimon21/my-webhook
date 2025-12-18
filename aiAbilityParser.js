console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY);

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * แปลงประโยคภาษาไทย → ทักษะที่ชอบ / ไม่ชอบ
 */
async function parseAbilitiesWithAI(userText) {
  if (!userText) {
    return { positive: [], negative: [] };
  }

  const prompt = `
คุณคือ AI ช่วยวิเคราะห์ความถนัดของนักเรียน

แปลงข้อความต่อไปนี้ให้เป็น JSON เท่านั้น
- positive = ทักษะ/กิจกรรมที่ผู้ใช้ "ชอบ"
- negative = ทักษะ/กิจกรรมที่ผู้ใช้ "ไม่ชอบ"

ข้อความ: "${userText}"

ตัวอย่างผลลัพธ์:
{
  "positive": ["กีฬา", "เต้น"],
  "negative": ["คณิต"]
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0
  });

  try {
    return JSON.parse(response.choices[0].message.content);
  } catch (err) {
    console.error("AI parse error:", err);
    return { positive: [], negative: [] };
  }
}

module.exports = { parseAbilitiesWithAI };
