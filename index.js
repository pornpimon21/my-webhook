require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const levenshtein = require('fast-levenshtein');
const Session = require('./models/session');
const EventLog = require('./models/eventLog');
const line = require('@line/bot-sdk');
const { SessionsClient } = require('@google-cloud/dialogflow');
const uuid = require('uuid');
const faculties = require('./facultiesData');
const { buildQuestionFlex } = require('./skillsMenu');
const analyzeAnswers = require('./analyze');
const questions = require('./questions');
const { faqFlex, faqs } = require('./faqFlex');
const { createPlanCard, handlePostback } = require('./flexTemplates');
const userSessions = {}; // <== ต้องมีไว้เก็บคำตอบของแต่ละ userId

const app = express();
const PORT = process.env.PORT || 3000;
//app.use(express.json());

const uri = process.env.MONGODB_URI;


const fs = require('fs');
const path = require('path');

const keyPath = path.join(__dirname, 'dialogflow-key.json');
if (!fs.existsSync(keyPath) && process.env.GOOGLE_CREDENTIALS_BASE64) {
  const buffer = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64');
  fs.writeFileSync(keyPath, buffer);
  console.log('✅ Created dialogflow-key.json from base64!');
}
process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;


mongoose.connect(uri)
.then(() => console.log('✅ MongoDB connected!'))
.catch(err => console.error('❌ MongoDB connection error:', err));

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new line.Client(lineConfig);
const projectId = process.env.DIALOGFLOW_PROJECT_ID;
const sessionClient = new SessionsClient();

async function detectIntentText(sessionId, text, languageCode = 'th') {
  const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text,
        languageCode,
      },
    },
  };

  const responses = await sessionClient.detectIntent(request);
  return responses[0].queryResult;
}


// ฟังก์ชันเปรียบเทียบความใกล้เคียง
function findClosestAbility(userInput, similarityThreshold = 0.85) {
  // แปลงข้อความเป็นตัวพิมพ์เล็ก และตัดช่องว่าง
  userInput = userInput.trim().toLowerCase();

  // รวมทุก ability ของ faculties และ majors (ตัดซ้ำ)
  const allAbilities = [...new Set(
    faculties.flatMap(f => f.majors.flatMap(m => m.ability))
  )].map(a => a.trim().toLowerCase());

  // 1️⃣ exact match ถ้าเจอคืนค่าเลย
  if (allAbilities.includes(userInput)) return userInput;

  // 2️⃣ prefix match เฉพาะ input ≥ 3 ตัวอักษร
  if (userInput.length >= 3) {
    const prefixMatch = allAbilities.find(a => a.startsWith(userInput));
    if (prefixMatch) return prefixMatch;
  }

  // 3️⃣ similarity ratio สำหรับพิมพ์ผิดเล็กน้อย
  let closest = null;
  let maxSimilarity = 0;
  for (const ability of allAbilities) {
    const dist = levenshtein.get(userInput, ability);
    const similarity = 1 - (dist / Math.max(userInput.length, ability.length));
    // รับเฉพาะ similarity สูงมากๆ
    if (similarity > maxSimilarity && similarity >= similarityThreshold) {
      maxSimilarity = similarity;
      closest = ability;
    }
  }

  return closest; // คืนค่าเฉพาะถ้า similarity สูงพอ
}

//จับคู่คณะและสาขา
function findMatchingMajors(grade, abilities, educationLevel) {
  let results = [];

 // แปลง abilities ของผู้ใช้เป็นค่าที่แม่นที่สุด
  const abilities = userAbilities
    .map(a => findClosestAbility(a))  // ใช้ฟังก์ชันแม่น ๆ
    .filter(a => a !== null);

  faculties.forEach(faculty => {
    faculty.majors.forEach(major => {
      // ตรวจสอบเกรดและระดับการศึกษา
      if (grade < major.grade) return;
      if (!major.requiredEducation.includes(educationLevel)) return;

      // ตรวจสอบว่า major มี ability ไหนตรงกับ abilities ของผู้ใช้
      const matchedAbilities = major.ability.filter(majorAbility =>
        abilities.includes(majorAbility.toLowerCase())
      );

      if (matchedAbilities.length === 0) return;

      results.push({
        faculty: faculty.name,
        major: major.name,
        matchedAbilities,
        condition: major.condition,
        grade: major.grade
      });
    });
  });

  // Top 5 จากจำนวน abilities ที่ตรงมากที่สุด
  let topByAbilities = results
    .sort((a, b) => b.matchedAbilities.length - a.matchedAbilities.length)
    .slice(0, 5);

  // เรียง Top 5 ตาม grade มาก → น้อย
  return topByAbilities.sort((a, b) => b.grade - a.grade);
}

// MongoDB Session Helper
async function getSession(sessionId) {
  let session = await Session.findOne({ sessionId });
  if (!session) session = new Session({ sessionId });
  return session;
}
async function saveSession(session) {
  await session.save();
}

// ✅ เพิ่มฟังก์ชันอัปเดต session
async function updateSession(sessionId, data) {
  return Session.updateOne({ sessionId }, { $set: data }, { upsert: true });
}

// Webhook Endpoint
app.use('/webhook', express.json());
app.post("/webhook", async (req, res) => {
  const eventId = req.body.originalDetectIntentRequest?.payload?.data?.webhookEventId;

  if (eventId) {
    try {
      const exists = await EventLog.findOne({ eventId });
      if (exists) {
        return res.status(200).send(); // 🛑 เคยประมวลผลแล้ว
      }
      await EventLog.create({ eventId }); // ✅ บันทึกไว้ว่าเคยแล้ว
    } catch (err) {
      console.error("❌ EventLog error:", err.message);
    }
  }  
   const intent = req.body.queryResult?.intent?.displayName || "";
   const params = req.body.queryResult?.parameters || {};
   const sessionFull = req.body.session || "default-session";

   const sessionId = sessionFull.split('/').pop();  // ดึงแค่ userId   
   const session = await getSession(sessionId);
   session.sessionId = sessionId;  // เซ็ตที่นี่แค่ครั้งเดียว  
   if (!session) session = { userId: sessionId };


  if (intent === "welcome") {
    return res.json({
      fulfillmentText: "🌟 สวัสดีค่ะ!\nยินดีต้อนรับสู่ระบบแนะนำคณะและสาขา 🎓\n\nเราพร้อมช่วยคุณค้นหาคณะที่เหมาะสมที่สุด\nเพื่อเริ่มต้น กรุณาพิมพ์ \"ชื่อของคุณ\" เข้ามาก่อนนะคะ 😊"
    });
  }

if (intent === "get name") {
  const name = params.name || "คุณ";
  session.name = name;
  await saveSession(session);

const levels = ["มัธยมปลาย", "ปวช", "ปวส", "อื่นๆ"];
const colors = ["#FFCC80", "#F48FB1", "#BA68C8", "#4FC3F7"];
const labels = {
  "มัธยมปลาย": "ม.ปลาย 🎓",
  "ปวช": "ปวช 🛠️",
  "ปวส": "ปวส 🔧",
  "อื่นๆ": "อื่นๆ 📘"
};
const levelBubbles = levels.map((level, index) => ({
  type: "bubble",
  size: "micro",
  body: {
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "button",
        style: "primary",
        color: colors[index],
        action: {
          type: "message",
          label: labels[level],
          text: level
        }
      }
    ]
  }
}));
// 1. ส่งข้อความตอบกลับ Dialogflow ก่อน
res.json({
fulfillmentText: `👋 สวัสดีค่ะ คุณ${name}\n📘 กรุณาเลือกระดับการศึกษาของคุณ 🎓\n👇 เลือกจากปุ่มด้านล่างได้เลยค่ะ`
});

// 2. หน่วงเวลาเล็กน้อยก่อน push message (เพื่อให้ข้อความขึ้นก่อน)
setTimeout(() => {
  client.pushMessage(sessionId, {
    type: "flex",
    altText: "เลือกระดับการศึกษา",
    contents: {
      type: "carousel",
      contents: levelBubbles
    }
  }).catch((err) => {
    console.error("Push message error:", err);
  });
}, 500); // ✅ รอ 500 มิลลิวินาที

return;
}

if (intent === "educationLevel") {
  const educationLevel = (params.educationLevel || "").toLowerCase();
  session.educationLevel = educationLevel;
  await saveSession(session);

  if (["มัธยมปลาย", "ปวช", "ปวส", "อื่นๆ"].includes(educationLevel)) {
    return res.json({
      fulfillmentText: `🎓 คุณ${session.name || ""} ได้เลือกระดับการศึกษา : ${educationLevel}\n\n` +
                       `📘 กรุณากรอกเกรดเฉลี่ย (GPAX) ของคุณ\nตัวอย่าง : 3.25 หรือ 3.50\n\n🔔 โปรดระบุค่าไม่เกิน 4.00 เพื่อความถูกต้องนะคะ 📈`,
      outputContexts: [{
        name: `${sessionFull}/contexts/ask_grad`,
        lifespanCount: 2
      }]
    });
  } else {
    return res.json({
      fulfillmentText: `⚠️ ขอโทษค่ะ คุณ${session.name || ""} 🙏\n\n` +
                       `❌ กรุณาเลือกระดับการศึกษาใหม่อีกครั้ง (มัธยมปลาย, ปวช, ปวส, อื่นๆ) 🙇‍♀️`,
      outputContexts: [{
        name: `${sessionFull}/contexts/ask_education`,
        lifespanCount: 2
      }]
    });
  }
} 

  if (intent === "get grade") {
    const grade = params.grade;
    if (typeof grade !== "number" || grade < 0 || grade > 4) {
      return res.json({
        fulfillmentText: "📊 กรุณาระบุเกรดเฉลี่ยของคุณ\nโดยต้องอยู่ในช่วง 0.0 - 4.0 นะคะ 😊",
      });
    }
    session.grade = grade;
    await saveSession(session);
    return res.json({
    fulfillmentText: `🙏 ขอบคุณค่ะ คุณ${session.name || ""}\n📊 เกรดเฉลี่ยของคุณ : ${grade}\n\n🧠 กรุณาระบุ *ความสามารถ* หรือ *ความถนัด* ของคุณ\nเช่น คอมพิวเตอร์ 💻 | คณิตศาสตร์ ➕ | การแสดง 🎭 | วาดรูป 🎨 | กีฬา ⚽ เป็นต้น 🚀`,
      outputContexts: [{
        name: `${sessionFull}/contexts/ask_skills`,
        lifespanCount: 2
      }]
    });
  } 

if (intent === "get skills") {
  let abilities = params.ability;
  if (typeof abilities === "string") {
    abilities = abilities.split(/[,\s]+/).map(a => a.trim());  // 🔁 ใช้ regex แยกทั้งคอมม่าและเว้นวรรค
    } else if (Array.isArray(abilities)) {
    abilities = abilities.flatMap(item => item.split(",").map(a => a.trim()));
  }
  
  abilities = abilities.filter(a => a.length > 0);
  abilities = [...new Set(abilities)];

  const grade = session.grade;
  const name = session.name;
  const educationLevel = session.educationLevel;

  
  if (!grade) {
    return res.json({
      fulfillmentText: "❗ กรุณาใส่เกรดเฉลี่ยก่อนค่ะ"
    });
  }

  if (abilities.length === 0) {
    return res.json({
      fulfillmentText: "⚠️🙏 กรุณาระบุความสามารถอย่างน้อย 1 อย่างค่ะ 🙏⚠️"
    });
  }
    let validAbilities = new Set();
    let invalid = [];

    abilities.forEach(a => {
      const closest = findClosestAbility(a);
      if (closest) validAbilities.add(closest);
      else invalid.push(a);
    });

    validAbilities = Array.from(validAbilities);

    if (invalid.length > 0) {
      return res.json({
        fulfillmentText: `⚠️ ขอโทษค่ะ\nคำว่า "${invalid.join(", ")}" เราไม่เข้าใจ\nช่วยกรอกความสามารถใหม่อีกครั้งนะคะ 😊`,
      });
    }

    const results = findMatchingMajors(grade, validAbilities, session.educationLevel);

    if (results.length === 0) {
      return res.json({
        fulfillmentText: `❌ ขออภัยค่ะ คุณ${name}\nเราไม่พบคณะที่เหมาะสมกับคุณในขณะนี้\nกรุณาลองใหม่อีกครั้งนะคะ 🙇‍♀️`
      });
    }

    const abilitiesInputText = abilities.join(", ");

let reply = `🙏 ขอบคุณค่ะคุณ${name || ''} จากข้อมูลที่คุณกรอกมามีดังนี้  \n` +
  `📘 เกรดเฉลี่ย : ${grade}    \n` +
  `🧠 ความสามารถหรือความถนัดของคุณ : ${abilitiesInputText}  \n\n` +
  `เราขอแนะนำคณะและสาขาที่เหมาะสมกับคุณดังนี้ : \n`;

results.forEach((r, i) => {
  const majorInfo = faculties
    .find(f => f.name === r.faculty)
    .majors.find(m => m.name === r.major);

  const requiredGrade = majorInfo.grade !== null ? majorInfo.grade : 'ไม่ระบุ';
  const allAbilitiesText = majorInfo.ability.join(", ");
  const matchedAbilitiesText = r.matchedAbilities.join(", ");
  const quotaText = majorInfo.quota ? `👥 รับจำนวน : ${majorInfo.quota} คน\n` : "";
  const conditionText = majorInfo.condition ? `📄 คุณสมบัติ : ${majorInfo.condition}\n` : "";
  const reasonText = majorInfo.reason ? `💡 เหตุผลที่เหมาะสม : ${majorInfo.reason}\n` : "";

  //ทำข้อความอาชีพให้อ่านง่าย (ถ้ามี)
  let careersText = "";
  if (majorInfo.careers && majorInfo.careers.length > 0) {
    careersText = "💼 เส้นทางอาชีพในอนาคต\n";
    careersText += majorInfo.careers.map(career => `  • ${career}`).join("\n") + "\n";
  }

  reply += `\n━━━━━━━━━━━━━━━━━━━━\n` + // เส้นแบ่งก่อนแต่ละอันดับ
           `🎓 อันดับที่ ${i + 1} ${r.faculty}\n` +
           `🏫 สาขา : ${r.major}\n` +
           `📊 เกรดเฉลี่ยขั้นต่ำที่กำหนด : ${requiredGrade}\n` +
           `🛠️ ทักษะความสามารถ : ${allAbilitiesText}\n` +
           `✅ ความสามารถของคุณที่ตรงกับสาขา : ${matchedAbilitiesText}\n` +
           quotaText +
           conditionText +
           reasonText +
           careersText;  // ต่อท้ายด้วยอาชีพ
});

reply += `\n✨ ขอให้โชคดีกับการเลือกคณะนะคะ!`;

// ✅ เก็บข้อมูลผู้ใช้ด้านบนสุดก่อนเลย และ // เก็บค่าผลลัพธ์ทั้งหมดใน session แบบ array (ไม่รวม quota, gradeRequirement, etc.) 5 ลำดับ
session.sessionId = sessionId;
session.name = name;
session.grade = grade;
session.abilitiesInputText = abilities.join(", ");

// แล้วค่อย map results
session.recommendations = results.map((r, i) => {
  const majorInfo = faculties
    .find(f => f.name === r.faculty)
    .majors.find(m => m.name === r.major);

  return {
    rank: i + 1,
    faculty: r.faculty,
    major: r.major,
    requiredGrade: majorInfo.grade,
    abilities: majorInfo.ability,           // ต้องเป็น array เช่น ['วิเคราะห์', 'สื่อสาร']
    matchedAbilities: r.matchedAbilities,   // ต้องเป็น array เช่น ['วิเคราะห์']
    quota: majorInfo.quota,
    condition: majorInfo.condition,
    reason: majorInfo.reason,
    careers: majorInfo.careers,

    // เพิ่มข้อมูลใหม่จาก majorInfo
    studyPlan: majorInfo.studyPlan,
    studyPlanPdf: majorInfo.studyPlanPdf,
    studyPlanInfoImg: majorInfo.studyPlanInfoImg,
    website: majorInfo.website,
    majorsFacebook: majorInfo.majorsFacebook,
    facultyFacebook: majorInfo.facultyFacebook,
    logoUrl: majorInfo.logoUrl
  };
});

// บันทึกลง MongoDB
await session.save();
        return res.json({
      fulfillmentText: reply
    });
  }

  return res.json({
    fulfillmentText: "ขออภัยค่ะ ไม่เข้าใจคำสั่ง\nกรุณาลองใหม่อีกครั้งนะคะ 😊"
  });
});


// --- เริ่มเพิ่มโค้ด LINE bot ที่นี่ ---
// สำหรับ LINE webhook ต้องใช้ express.raw() เพื่อให้ middleware ตรวจสอบ signature ได้ถูกต้อง
app.post('/linewebhook',
  express.raw({ type: 'application/json' }),
  line.middleware(lineConfig),
  async (req, res) => {
    try {
      const events = req.body.events;

      await Promise.all(events.map(async (event) => {
        if (event.type === "postback") {
          console.log("📩 ได้ postback:", event.postback.data);
          await handlePostback(event, client, faculties);
          return;
        }

        if (event.type === 'message' && event.message.type === 'text') {
          const userId = event.source.userId;
          const userMessage = event.message.text;
          const sessionId = event.source.userId || uuid.v4();  // LINE user ID ใช้แทน session


if (userMessage === "คำถามที่พบบ่อย") {
    // ส่งเมนู FAQ Flex Message
    await client.replyMessage(event.replyToken, faqFlex);
    return;
  }

  if (faqs[userMessage]) {
    // ส่งคำตอบ FAQ ตามคำถามที่ผู้ใช้เลือก
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: faqs[userMessage],
    });
    return;
  }

if (userMessage === "คำกิจกรรมที่ระบบเข้าใจ") {
  const categorizedActivityFlex = {
    type: "flex",
    altText: "คำกิจกรรมที่ระบบเข้าใจ",
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "lg",
        contents: [
          {
            type: "text",
            text: "🧠 คำกิจกรรมที่ระบบเข้าใจ",
            weight: "bold",
            size: "lg",
            color: "#0D99FF"
          },
          {
            type: "text",
            text: "ระบบสามารถวิเคราะห์ความถนัดของคุณได้จากกิจกรรมในหมวดหมู่ต่าง ๆ เหล่านี้ 👇",
            wrap: true,
            size: "sm",
            color: "#555555"
          },
          {
            type: "separator",
            color: "#AAAAAA"
          },

          // 🔹 ศิลปะ / ความคิดสร้างสรรค์
          {
            type: "text",
            text: "🎨 ศิลปะ / ความคิดสร้างสรรค์",
            weight: "bold",
            size: "md",
            color: "#333333"
          },
          {
            type: "text",
            text: "การแสดง, ดนตรี, วาดรูป, การออกแบบ, การประดิษฐ์",
            wrap: true,
            size: "sm",
            color: "#666666"
          },

          // 🔹 เทคโนโลยี / วิเคราะห์
          {
            type: "text",
            text: "💻 เทคโนโลยี / วิเคราะห์",
            weight: "bold",
            size: "md",
            margin: "md",
            color: "#333333"
          },
          {
            type: "text",
            text: "คอมพิวเตอร์, เขียนโค้ด, วิเคราะห์ข้อมูล, เกม, การคิดเชิงตรรกะ",
            wrap: true,
            size: "sm",
            color: "#666666"
          },

          // 🔹 วิชาการ / ภาษา
          {
            type: "text",
            text: "📚 วิชาการ / ภาษา",
            weight: "bold",
            size: "md",
            margin: "md",
            color: "#333333"
          },
          {
            type: "text",
            text: "การอ่าน, การเขียน, คณิตศาสตร์, วิทยาศาสตร์, ภาษาต่างประเทศ",
            wrap: true,
            size: "sm",
            color: "#666666"
          },

          // 🔹 การสื่อสาร / ผู้นำ
          {
            type: "text",
            text: "🗣 การสื่อสาร / ผู้นำ",
            weight: "bold",
            size: "md",
            margin: "md",
            color: "#333333"
          },
          {
            type: "text",
            text: "การพูด, การเจรจา, การทำงานเป็นทีม, การสื่อสาร, การจัดการงาน",
            wrap: true,
            size: "sm",
            color: "#666666"
          },

          // 🔹 สุขภาพ / การเคลื่อนไหว
          {
            type: "text",
            text: "⚽ สุขภาพ / การเคลื่อนไหว",
            weight: "bold",
            size: "md",
            margin: "md",
            color: "#333333"
          },
          {
            type: "text",
            text: "กีฬา, การเต้น, งานกลางแจ้ง, งานช่าง",
            wrap: true,
            size: "sm",
            color: "#666666"
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "พิมพ์หรือเลือกคำจากหมวดด้านบนเมื่อตอบคำถามได้เลยค่ะ ✨",
            wrap: true,
            size: "sm",
            align: "center",
            color: "#888888",
            margin: "md"
          }
        ]
      }
    }
  };

  await client.replyMessage(event.replyToken, categorizedActivityFlex);
  return;
}


if (userMessage === 'ค้นหาความถนัด') {
  userSessions[userId] = { step: 0, answers: [] };
  const question = buildQuestionFlex(0);

  // ส่งข้อความต้อนรับ + คำถามข้อแรกใน replyMessage ทีเดียว
  await client.replyMessage(event.replyToken, [
    {
      type: 'text',
      text: `👋 สวัสดีค่ะ!\n\n` +
        `วันนี้เราจะช่วยคุณค้นหาความถนัดที่เหมาะสมกับตัวเอง ✨ ผ่านคำถามง่าย ๆ ไม่กี่ข้อ\n` +
        `กรุณาเลือกคำตอบที่ตรงกับตัวคุณมากที่สุด เพื่อให้ผลลัพธ์แม่นยำที่สุดนะคะ 😊\n\n` +
        `พร้อมแล้ว... ไปเริ่มกันเลย! 🚀`
    },
    ...(Array.isArray(question) ? question : [question])
  ]);
  return;
}

// ถ้าอยู่ใน session การค้นหาความถนัด
if (userSessions[userId]) {
  const session = userSessions[userId];

  // เก็บคำตอบของคำถามปัจจุบัน (step ปัจจุบัน)
  session.answers[session.step] = userMessage;

  // เพิ่ม step ไปถามคำถามข้อถัดไป
  session.step++;

  if (session.step < questions.length) {
    const nextQuestion = buildQuestionFlex(session.step);

    // ส่งคำถามถัดไปใน replyMessage ครั้งเดียว
    await client.replyMessage(event.replyToken, Array.isArray(nextQuestion) ? nextQuestion : [nextQuestion]);
  } else {
    // วิเคราะห์คำตอบทั้งหมด
    const result = analyzeAnswers(session.answers);

    // สร้าง flex message สำหรับแสดงผลลัพธ์
    const flexResult = {
      type: "flex",
      altText: "ผลการวิเคราะห์ความถนัดของคุณ",
      contents: {
        type: "bubble",
        size: "mega",
        body: {
          type: "box",
          layout: "vertical",
          spacing: "lg",
          contents: [
            {
              type: "text",
              text: "🎯 ผลการวิเคราะห์ความถนัด",
              weight: "bold",
              size: "lg",
              color: "#1DB446",
            },
            {
              type: "separator",
              margin: "md",
              color: "#666666"
            },
            {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              margin: "lg",
              contents: [
                {
                  type: "text",
                  text: "📌 คุณเหมาะกับสายงาน",
                  size: "md",
                  weight: "bold",
                  color: "#333333"
                },
                {
                  type: "text",
                  text: result.bestTrack || "ไม่สามารถวิเคราะห์ได้",
                  size: "md",
                  weight: "bold",
                  color: "#0D99FF",
                  wrap: true
                }
              ]
            },
            {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              margin: "lg",
              contents: [
                {
                  type: "text",
                  text: "💡 จุดเด่นของคุณ",
                  size: "md",
                  weight: "bold",
                  color: "#333333"
                },
                {
                  type: "text",
                  text: result.traits.length > 0 ? result.traits.join(', ') : "ไม่มีข้อมูล",
                  wrap: true,
                  color: "#555555"
                }
              ]
            },
            {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              margin: "lg",
              contents: [
                {
                  type: "text",
                  text: "📎 คำแนะนำ",
                  size: "md",
                  weight: "bold",
                  color: "#333333"
                },
                {
                  type: "text",
                  text: "ลองมุ่งเน้นพัฒนาทักษะที่เกี่ยวข้องกับสายงานนี้เพื่อความก้าวหน้าในอนาคต 😊",
                  wrap: true,
                  color: "#555555"
                }
              ]
            }
          ]
        },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "ขอบคุณที่ร่วมสนุกกับเรา 💚",
          size: "sm",
          align: "center",
          color: "#888888",
          margin: "md"
        },
        {
          type: "button",
          action: {
            type: "message",
            label: "🔁 เริ่มค้นหาความถนัดใหม่",
            text: "ค้นหาความถนัด"
          },
          style: "primary",
          color: "#1DB446",
          margin: "md"
        }
      ]
    }
  }
};
    // ส่งข้อความแจ้งผลลัพธ์ใน replyMessage ครั้งเดียว
    await client.replyMessage(event.replyToken, flexResult);

    // ลบ session หลังจบ
    delete userSessions[userId];
  }
  return;
}


if (userMessage === 'เริ่มแนะนำคณะสาขาใหม่') {
  let session = await Session.findOne({ sessionId: sessionId });

  if (session && session.name && session.grade && session.educationLevel) {
    session.abilitiesInputText = '';
    session.recommendations = [];

    await session.save();

    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: `🔄 มาเริ่มแนะนำคณะสาขากันใหม่จากข้อมูลเดิมนะคะ!\n\n` +
            `👤 ชื่อ : ${session.name}\n` +
            `📚 ระดับการศึกษา : ${session.educationLevel}\n` +
            `📊 เกรด : ${session.grade}\n\n` +
            `กรุณาพิมพ์ความสามารถหรือกิจกรรมที่คุณถนัด เช่น คอมพิวเตอร์ คณิต การแสดง เป็นต้น 🧠✨`
    });
    return;
  } else {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '⚠️ ขอโทษค่ะ ไม่พบข้อมูลเก่าครบถ้วน กรุณากด "แนะนำคณะ" เพื่อเริ่มต้นใหม่นะคะ 💬'
    });
    return;
  }
}

if (userMessage.startsWith("📚 แผนการเรียน")) {
  const lines = userMessage.split("\n");
  const facultyName = lines[1].replace("🏛️ คณะ : ", "").trim();
  const majorName = lines[2].replace("📘 สาขา : ", "").trim();

    const session = await getSession(event.source.userId);
    const rec = session?.recommendations?.find(
      r => r.faculty === facultyName && r.major === majorName
    );

    if (!rec) {
      await client.replyMessage(event.replyToken, {
        type: "text",
        text: "❌ ไม่พบข้อมูลแผนการเรียนของสาขานี้ค่ะ"
      });
      return;
    }
 const planCard = createPlanCard(facultyName, majorName, rec);

    await client.replyMessage(event.replyToken, {
      type: "flex",
      altText: "แผนการเรียน",
      contents: planCard
    });
     return;
  }


  if (userMessage.startsWith("🗂️ แผนการเรียน")) {
    const lines = userMessage.split("\n");
    const facultyName = lines[1].replace("🏛️ คณะ : ", "").trim();
    const majorName = lines[2].replace("📘 สาขา : ", "").trim();
  
    // หา faculty ในข้อมูล faculties
    const matchedFaculty = faculties.find(f => f.name === facultyName);
    if (!matchedFaculty) {
      await client.replyMessage(event.replyToken, {
        type: "text",
        text: "❌ ไม่พบคณะที่ระบุค่ะ"
      });
      return;
    }
  
    // หา major ใน faculty
    const matchedMajor = matchedFaculty.majors.find(m => m.name === majorName);
    if (!matchedMajor) {
      await client.replyMessage(event.replyToken, {
        type: "text",
        text: "❌ ไม่พบสาขาที่ระบุค่ะ"
      });
      return;
    }
  
    // เช็คว่ามีแผนการเรียนไหม
    if (!matchedMajor.studyPlan || matchedMajor.studyPlan.length === 0) {
      await client.replyMessage(event.replyToken, {
        type: "text",
        text: "❌ ไม่พบข้อมูลแผนการเรียนของสาขานี้ค่ะ"
      });
      return;
    }
  
    // สร้าง rec จากข้อมูลใน matchedMajor
    const rec = {
      studyPlan: matchedMajor.studyPlan,
      studyPlanPdf: matchedMajor.studyPlanPdf || null,
      studyPlanInfoImg: matchedMajor.studyPlanInfoImg || null
    };
  
    // สร้าง Flex card
    const planCard = createPlanCard(facultyName, majorName, rec);
  
    await client.replyMessage(event.replyToken, {
      type: "flex",
      altText: "แผนการเรียน",
      contents: planCard
    });
  
    return;
  }  

// ฟังก์ชันช่วยตรวจสอบข้อความ ให้รองรับทั้ง string และ number
const safeText = (text) => {
  if (typeof text === 'string' && text.trim() !== '') return text;
  if (typeof text === 'number') return text.toString();
  return 'ไม่ระบุ';
};

const safeArray = (arr) =>
  Array.isArray(arr) && arr.length > 0 ? arr : ['ไม่ระบุ'];

// STEP 1: คำสั่ง "ค้นหาคณะสาขา" -> แสดง Flex Message เลือกคณะ
if (userMessage === 'ค้นหาคณะสาขา') {
  // สร้าง bubbles สำหรับคณะ (ปุ่มสีสลับฟ้า/ชมพู)
  const facultyBubbles = faculties.map((faculty, index) => ({
    type: "bubble",
    size: "micro",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
      {
        type: "text",
        text: faculty.name,   // แสดงชื่อเต็มตรงนี้
        weight: "bold",
        size: "sm",
        wrap: true,
        align: "center"
      }
    ],      
      paddingAll: "10px",
      spacing: "sm"
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          style: "primary",
          color: index % 2 === 0 ? "#1E90FF" : "#FF69B4",
          action: {
            type: "message",
            label: `เลือก 🎯`,
            text: faculty.name
          }
        }
      ],
      paddingAll: "10px",
      spacing: "sm"
    }
  }));

  await client.replyMessage(event.replyToken, [
    {
      type: 'text',
      text: '🙏 สวัสดีค่ะ!\nกรุณาเลือกคณะที่สนใจของคุณด้านล่างนี้ค่ะ 😊\n➡️ เพื่อดูรายละเอียดและสาขาต่าง ๆ'
    },
    {
      type: "flex",
      altText: "กรุณาเลือกคณะที่สนใจ",
      contents: {
        type: "carousel",
        contents: facultyBubbles
      }
    }
  ]);
  return;
}


// ฟังก์ชันแบ่ง array เป็นกลุ่มย่อยละไม่เกิน 10
function chunkArray(array, size = 10) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

// ฟังก์ชันสร้าง Flex Message สำหรับสาขา
function createMajorFlexMessage(faculty, page = 1) {
  const majorEmojiMap = {
    "คอมพิวเตอร์": "💻",
    "วิศวกรรม": "⚙️",
    "การแพทย์": "🏥",
    "บริหารธุรกิจ": "💼",
    "ศิลปกรรมศาสตร์": "🎨",
    "การศึกษา": "📚",
    "สังคมศาสตร์": "🌍",
    "ภาษาไทย": "🗣️",
    "วิทยาศาสตร์ทั่วไป": "🔬",
    "กฎหมาย": "⚖️",
  };

  const chunks = chunkArray(faculty.majors, 10);
  const majors = chunks[page - 1];
  if (!majors) return null;

  const bubbles = majors.map((major, index) => {
    let emoji = "";
    for (const key in majorEmojiMap) {
      if (major.name.includes(key)) {
        emoji = majorEmojiMap[key];
        break;
      }
    }

    return {
      type: "bubble",
      size: "micro",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `${emoji ? emoji + " " : ""}${major.name}`,
            weight: "bold",
            size: "sm",
            wrap: true,
            align: "center"
          }
        ],
        paddingAll: "10px",
        spacing: "sm"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            color: index % 2 === 0 ? "#FFA500" : "#32CD32",
            action: {
              type: "message",
              label: "เลือก 📖",
              text: major.name
            }
          }
        ],
        paddingAll: "10px",
        spacing: "sm"
      }
    };
  });

  // ถ้ามีหน้าถัดไป ให้เพิ่มปุ่ม "ดูเพิ่มเติม"
  if (page < chunks.length) {
    bubbles.push({
      type: "bubble",
      size: "micro",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "➡️ ดูเพิ่มเติม",
            align: "center",
            weight: "bold"
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "secondary",
            action: {
              type: "message",
              label: "ดูเพิ่มเติม",
              text: `➡️ ดูสาขาเพิ่มเติม \nหน้า ${page + 1} ของ 🎓 ${faculty.name}`
            }
          }
        ]
      }
    });
  }

  return {
    type: "flex",
    altText: `เลือกสาขาใน "${faculty.name}" หน้า ${page}`,
    contents: {
      type: "carousel",
      contents: bubbles
    }
  };
}

// STEP 2: ตรวจสอบว่าเป็น "ดูเพิ่มเติม:{ชื่อคณะ}:{หน้าที่}"
const regex = /^➡️ ดูสาขาเพิ่มเติม\s*\n\s*หน้า\s*(\d+)\s*ของ\s*🎓\s*(.+)$/;
const match = userMessage.match(regex);
if (match) {
  const page = parseInt(match[1]);
  const facultyName = match[2];
  const faculty = faculties.find(f => f.name === facultyName);
  if (faculty) {
    const flexMsg = createMajorFlexMessage(faculty, page);
    if (flexMsg) {
      await client.replyMessage(event.replyToken, flexMsg);
    } else {
      await client.replyMessage(event.replyToken, {
        type: "text",
        text: "ไม่พบข้อมูลเพิ่มเติมแล้วค่ะ 😊"
      });
    }    
    return;
  }
}

// STEP 3: ถ้าผู้ใช้พิมพ์ชื่อคณะ (เช่น "คณะครุศาสตร์")
const selectedFaculty = faculties.find(f => f.name === userMessage);
if (selectedFaculty) {
  // ตอบข้อความแนะนำก่อน
  await client.replyMessage(event.replyToken, {
    type: "text",
    text: `🎓 กรุณาเลือกสาขาที่สนใจใน "${selectedFaculty.name}" ด้านล่างนี้ค่ะ 😊`
  });

  // สร้าง Flex และส่งสาขาในหน้าที่ 1
  const flexMsg = createMajorFlexMessage(selectedFaculty, 1);
  if (flexMsg) {
    await client.pushMessage(event.source.userId, flexMsg);
  }
  return;
}

// STEP 3: เลือกสาขา
let matchedMajor, matchedFaculty;
for (const faculty of faculties) {
  const found = faculty.majors.find(m => m.name === userMessage);
  if (found) {
    matchedMajor = found;
    matchedFaculty = faculty;
    break;
  }
}

if (matchedMajor) {
  const gradeText = safeText(matchedMajor?.grade);
  const conditionText = safeText(matchedMajor?.condition);
  const abilityText = safeArray(matchedMajor?.ability).join(", ");
  const quotaText = safeText(matchedMajor?.quota);
  const careersArray = safeArray(matchedMajor?.careers);
  const facultyName = safeText(matchedFaculty?.name);
  const majorName = safeText(matchedMajor?.name);

  const careersContents = careersArray.map(career => ({
    type: "text",
    text: `• ${career}`,
    size: "sm",
    wrap: true
  }));

  const bubble = {
    type: "bubble",
    size: "mega",
    hero: {
      type: "image",
      url: safeText(matchedMajor?.logoUrl) || "https://www.uru.ac.th/images/logouru2011.png",
      size: "full",
      aspectRatio: "1.51:1",
      aspectMode: "fit"
    },
      header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `📚 ${safeText(matchedFaculty?.name)}`,
          weight: "bold",
          size: "lg",
          wrap: true
        },
        {
          type: "text",
          text: `📘 สาขา${safeText(matchedMajor?.name)}`,
          weight: "bold",
          size: "md",
          wrap: true
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        // เกรดขั้นต่ำ
        { type: "text", text: "📊 เกรดขั้นต่ำ", size: "sm", weight: "bold", margin: "md" },
        { type: "text", text: gradeText, size: "sm", wrap: true },

        // ทักษะความสามารถ
        { type: "text", text: "🧠 ความสามารถที่ควรมี", size: "sm", weight: "bold", margin: "md" },
        { type: "text", text: abilityText, size: "sm", wrap: true },

        // จำนวนที่รับ
        { type: "text", text: "✍️ รับจำนวน", size: "sm", weight: "bold", margin: "md" },
        { type: "text", text: quotaText, size: "sm", wrap: true },

        // คุณสมบัติ
        { type: "text", text: "📝 คุณสมบัติ", size: "sm", weight: "bold", margin: "md" },
        { type: "text", text: conditionText, size: "sm", wrap: true },

        // อาชีพ
        { type: "text", text: "🎯 เส้นทางอาชีพในอนาคต", size: "sm", weight: "bold", margin: "md" },
        ...careersContents,

        // ช่องทางติดตามข่าวสาร
        { type: "text", text: "🔗 ช่องทางติดตามข่าวสาร", size: "sm", weight: "bold", wrap: true, margin: "md" },
        {
          type: "box",
          layout: "horizontal",
          spacing: "sm",
          contents: [
            {
              type: "box",
              layout: "vertical",
              flex: 1,
              spacing: "xs",
              contents: [
                {
                  type: "button",
                  style: "link",
                  height: "sm",
                  action: {
                    type: "uri",
                    label: "🌐",
                    uri: safeText(matchedMajor?.website) || "https://edu.uru.ac.th/"                  }
                },
                {
                  type: "text",
                  text: "เว็บไซต์",
                  align: "center",
                  size: "xs",
                  wrap: true
                }
              ]
            },
            {
              type: "box",
              layout: "vertical",
              flex: 1,
              spacing: "xs",
              contents: [
                {
                  type: "button",
                  style: "link",
                  height: "sm",
                  action: {
                    type: "uri",
                    label: "📘",
                    uri: safeText(matchedMajor?.majorsFacebook) || "https://www.facebook.com/"                  }
                },
                {
                  type: "text",
                  text: "สาขา",
                  align: "center",
                  size: "xs",
                  wrap: true
                }
              ]
            },
            {
              type: "box",
              layout: "vertical",
              flex: 1,
              spacing: "xs",
              contents: [
                {
                  type: "button",
                  style: "link",
                  height: "sm",
                  action: {
                    type: "uri",
                    label: "🏛️",
                    uri: safeText(matchedMajor?.facultyFacebook) || "https://www.facebook.com/"                  }
                },
                {
                  type: "text",
                  text: "คณะ",
                  align: "center",
                  size: "xs",
                  wrap: true
                }
              ]
            }
          ]
        }
      ]
    },
    footer: {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "button",
          style: "secondary",
          action: {
            type: "message",
            label: "แผนการเรียน",
            text: `🗂️ แผนการเรียน\n🏛️ คณะ : ${facultyName}\n📘 สาขา : ${majorName}`
          }
        },    
        {
          type: "button",
          style: "primary",
          action: {
            type: "message",
            label: "เริ่มใหม่",
            text: "ค้นหาคณะสาขา"
          }
        }
      ]
    }
  };

console.log("✅ Bubble Payload:", JSON.stringify(bubble, null, 2));

await client.replyMessage(event.replyToken, [
  {
    type: "text",
    text: `🔍 รายละเอียดของคณะที่คุณเลือกมีดังนี้ค่ะ\n\n🏫 ${safeText(matchedFaculty?.name)}\n🎓 สาขาวิชา${safeText(matchedMajor?.name)}`
  },
  {
    type: "flex",
    altText: `ข้อมูลสาขา ${safeText(matchedMajor?.name)}`.slice(0, 400),
    contents: bubble
  }
]);
  return;  
}

          // ตรวจสอบ Intent จาก Dialogflow
          const dialogflowResult = await detectIntentText(sessionId, userMessage);
          const replyText = dialogflowResult.fulfillmentText || '❗ ขออภัยค่ะ  \nฉันไม่เข้าใจข้อความของคุณในครั้งนี้  \nกรุณาลองพิมพ์ใหม่อีกครั้งนะคะ 😊';

          // <--- ตรงนี้คือจุดที่ให้ใส่โค้ดแสดง carousel --->
          if (dialogflowResult.intent && dialogflowResult.intent.displayName === 'get skills') {
            // ดึงข้อมูล session จาก MongoDB
            const session = await getSession(sessionId);

          if (session && session.recommendations && session.recommendations.length > 0) {
          // สร้างข้อความแนะนำก่อน carousel
          const introText = `🙏 ขอบคุณค่ะ คุณ${session.name || ''} จากข้อมูลที่คุณกรอกมามีดังนี้\n\n` +
                  `🎓 ระดับการศึกษา : ${session.educationLevel || 'ยังไม่ระบุ'}\n` +  // ✅ เพิ่มบรรทัดนี้
                  `📘 เกรดเฉลี่ย : ${session.grade}\n` +
                  `🧠 ความสามารถหรือความถนัดของคุณ : ${session.abilitiesInputText}\n\n` +
                  `🎯 เราขอแนะนำคณะและสาขาที่เหมาะสมกับคุณ 5 ลำดับดังนี้ค่ะ 👇`;
              // สร้าง Flex Message carousel
const bubbles = session.recommendations.map((rec) => {
const facultyName = rec.faculty || "";
const majorName = rec.major || "";
  return {
    type: "bubble",
    size: "mega",
    hero: {
      type: "image",
      url: rec.logoUrl || "https://www.uru.ac.th/images/logouru2011.png",
      size: "full",
      aspectRatio: "1.51:1",
      aspectMode: "fit"
    },
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `🎓 อันดับที่ ${rec.rank}`,
          weight: "bold",
          color: "#1DB446",
          size: "lg"
        },
        {
          type: "text",
          text: rec.faculty,
          weight: "bold",
          size: "md",
          wrap: true,
          margin: "sm"
        },
        {
          type: "text",
          text: `🏫 สาขา${rec.major}`,
          weight: "bold",
          size: "sm",
          wrap: true
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "text",
          text: "📊 เกรดขั้นต่ำที่กำหนด",
          size: "sm",
          weight: "bold",
          wrap: true,
          margin: "md"
        },
        {
          type: "text",
          text: rec.requiredGrade !== null ? `${rec.requiredGrade}` : "ไม่ระบุ",
          size: "sm",
          wrap: true,
          margin: "xs"
        },
        {
          type: "text",
          text: "🛠️ ทักษะความสามารถ",
          size: "sm",
          weight: "bold",
          wrap: true,
          margin: "md"
        },
        {
          type: "text",
          text: rec.abilities?.length > 0 ? `${rec.abilities.join(", ")}` : "ไม่ระบุ",
          size: "sm",
          wrap: true,
          margin: "xs"
        },
        {
          type: "text",
          text: "✅ ความสามารถของคุณที่ตรงกับสาขา",
          size: "sm",
          weight: "bold",
          wrap: true,
          margin: "md"
        },
        {
          type: "text",
          text: rec.matchedAbilities?.length > 0 ? `${rec.matchedAbilities.join(", ")}` : "ไม่ระบุ",
          size: "sm",
          wrap: true,
          margin: "xs"
        },
        {
          type: "text",
          text: "👥 รับจำนวน",
          size: "sm",
          weight: "bold",
          wrap: true,
          margin: "md"
        },
        {
          type: "text",
          text: rec.quota ? `${rec.quota} คน` : "ไม่ระบุ",
          size: "sm",
          wrap: true,
          margin: "xs"
        },
        {
          type: "text",
          text: "📄 คุณสมบัติ",
          size: "sm",
          weight: "bold",
          wrap: true,
          margin: "md"
        },
        {
          type: "text",
          text: rec.condition || "ไม่ระบุ",
          size: "sm",
          wrap: true,
          margin: "xs"
        },
        {
          type: "text",
          text: "💡 เหตุผลที่เหมาะสม",
          size: "sm",
          weight: "bold",
          wrap: true,
          margin: "md"
        },
        {
          type: "text",
          text: rec.reason || "ไม่ระบุ",
          size: "sm",
          wrap: true,
          margin: "xs"
        },
        {
          type: "text",
          text: "💼 เส้นทางอาชีพในอนาคต",
          weight: "bold",
          margin: "md",
          size: "sm"
        },
        ...(rec.careers?.length > 0
          ? rec.careers.map(career => ({
              type: "text",
              text: `• ${career}`,
              size: "sm",
              margin: "xs",
              wrap: true
            }))
          : [
              {
                type: "text",
                text: "ไม่ระบุ",
                size: "sm",
                margin: "xs"
              }
            ]),
{
  type: "text",
  text: "🔗 ช่องทางติดตามข่าวสาร",
  size: "sm",
  weight: "bold",
  wrap: true,
  margin: "md"
},
{
  type: "box",
  layout: "horizontal",
  spacing: "sm",
  contents: [
    {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          style: "link",
          height: "sm",
          action: {
            type: "uri",
            label: "🌐",
            uri: rec.website || "https://edu.uru.ac.th/"
          }
        },
        {
          type: "text",
          text: "เว็บไซต์",
          align: "center",
          size: "xs",
          wrap: true
        }
      ],
      flex: 1,
      spacing: "xs"
    },
    {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          style: "link",
          height: "sm",
          action: {
            type: "uri",
            label: "📘",
            uri: rec.majorsFacebook || "https://www.facebook.com/"
          }
        },
        {
          type: "text",
          text: "สาขา",
          align: "center",
          size: "xs",
          wrap: true
        }
      ],
      flex: 1,
      spacing: "xs"
    },
    {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          style: "link",
          height: "sm",
          action: {
            type: "uri",
            label: "🏛️",
            uri: rec.facultyFacebook || "https://www.facebook.com/"
          }
        },
        {
          type: "text",
          text: "คณะ",
          align: "center",
          size: "xs",
          wrap: true
        }
      ],
      flex: 1,
      spacing: "xs"
    }
  ]
  }
  ]
    },
  footer: {
  type: "box",
  layout: "horizontal",
  spacing: "sm",
  contents: [
    {
      type: "button",
      style: "secondary",
      action: {
        type: "message",
        label: "แผนการเรียน",
        text: `📚 แผนการเรียน\n🏛️ คณะ : ${facultyName}\n📘 สาขา : ${majorName}`
      }
    },
    {
      type: "button",
      style: "primary",
      action: {
        type: "message",
        label: "เริ่มใหม่",
        text: "เริ่มแนะนำคณะสาขาใหม่"
      }        }
      ]
    }
  };
});

await client.replyMessage(event.replyToken, [
  {
    type: "text",
    text: introText
  },
  {
    type: "flex",
    altText: "ผลลัพธ์แนะนำคณะและสาขา",
    contents: {
      type: "carousel",
      contents: bubbles
    },
  },
]);
  return;  // หยุดโค้ดตรงนี้เพื่อไม่ส่งข้อความอื่นซ้ำ
              } else {
              // กรณี session ไม่มี recommendations
              await client.replyMessage(event.replyToken, {
                type: "text",
                text: "❌ ขออภัยค่ะ เราไม่พบคณะที่เหมาะสมกับคุณในขณะนี้\nกรุณากดแนะนำคณะใหม่อีกครั้งนะคะ 🙇‍♀️"
              });
              return;
            }
          }
             // กรณีทั่วไป ตอบข้อความธรรมดา
          await client.replyMessage(event.replyToken, {
            type: 'text',
            text: replyText,
          });
        }
      }));

      res.status(200).send('OK');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error');
    }
  }
);
// --- จบโค้ด LINE bot ---

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});