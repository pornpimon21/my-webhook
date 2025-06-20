require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const levenshtein = require('fast-levenshtein');
const Session = require('./models/session');
const EventLog = require('./models/eventLog');
const line = require('@line/bot-sdk');
const { SessionsClient } = require('@google-cloud/dialogflow');
const uuid = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
//app.use(express.json());

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
.then(() => console.log('✅ MongoDB connected!'))
.catch(err => console.error('❌ MongoDB connection error:', err));

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const lineClient = new line.Client(lineConfig);
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

// ข้อมูลจำลอง
const faculties = [
  {
    name: 'คณะครุศาสตร์',
    majors: [
      {
        name: 'ภาษาไทย',
        grade: 2.75,
        ability: ['ภาษาไทย', 'สอน', 'ครู', 'รักเด็ก', 'เข้าใจในการสอน', 'การเขียน', 'สื่อสาร', 'วรรณกรรม', 'การอ่าน', 'จับใจความ', 'ไวยากรณ์', 'เรียบเรียง'],
        quota: 60,
        condition: "เกรดวิชาภาษาไทยไม่ต่ำกว่า 3.0",
        reason: 'คุณมีความสามารถด้านภาษาไทย และรักในการสื่อสารผ่านภาษา เหมาะกับการถ่ายทอดความรู้ทางภาษาให้ผู้อื่น'
      },
      {
        name: 'คณิตศาสตร์',
        grade: 3.0,
        ability: ['คณิตศาสตร์', 'คิดวิเคราะห์', 'แก้ปัญหา', 'ตรรกะ'],
        quota: 50,
        condition: "เกรดวิชาคณิตศาสตร์ไม่ต่ำกว่า 3.0",
        reason: 'คุณมีความถนัดด้านตัวเลขและตรรกะ เหมาะกับการเรียนคณิตศาสตร์'
      }
    ]
  },
  {
    name: 'คณะมนุษยศาสตร์และสังคมศาสตร์',
    majors: [
      {
        name: 'รัฐประศาสนศาสตร์',
        grade: null,
        ability: ['สังคม', 'การเมือง', 'บริหาร', 'กฎหมาย'],
        quota: null,
        condition: null,
        reason: null
      },
      {
        name: 'จิตวิทยา',
        grade: 2.5,
        ability: ['จิตวิทยา', 'วิเคราะห์คน', 'เข้าใจพฤติกรรม', 'สื่อสาร'],
        quota: 40,
        condition: "เกรดเฉลี่ยไม่ต่ำกว่า 2.5",
        reason: 'เหมาะกับผู้ที่สนใจศึกษาเกี่ยวกับพฤติกรรมมนุษย์'
      }
    ]
  }
];

// ฟังก์ชันเปรียบเทียบความใกล้เคียง
function findClosestAbility(userInput, thresholdRatio = 0.5) {
  userInput = userInput.trim().toLowerCase();
  const allAbilities = [...new Set(faculties.flatMap(f => f.majors.flatMap(m => m.ability)))].map(a => a.trim().toLowerCase());

  if (allAbilities.includes(userInput)) return userInput;

  // 🔍 เช็คคำที่ขึ้นต้นด้วย (prefix match) เช่น "คณิต" = "คณิตศาสตร์"
  const prefixMatch = allAbilities.find(a => a.startsWith(userInput));
  if (prefixMatch) return prefixMatch;

  // 🔍 หรือคำที่ userInput อยู่ในความสามารถ (partial match)
  const partialMatch = allAbilities.find(a => a.includes(userInput));
  if (partialMatch) return partialMatch;

  // 🧠 กำหนด threshold แบบ dynamic จากความยาว input
  const threshold = Math.ceil(userInput.length * thresholdRatio);

  let closest = null, minDist = Infinity;
  for (const ability of allAbilities) {
    const dist = levenshtein.get(userInput, ability);
    if (dist < minDist) {
      minDist = dist;
      closest = ability;
    }
  }

  return minDist <= threshold ? closest : null;
}

// ฟังก์ชันจับคู่สาขา
function findMatchingMajors(grade, abilities) {
  let results = [];

  faculties.forEach(faculty => {
    faculty.majors.forEach(major => {
      const matchGrade = (major.grade === null || grade >= major.grade);

      const matchedAbilities = major.ability.filter(majorAbility => {
        return abilities.some(userAbility => {
          const dist = levenshtein.get(userAbility, majorAbility);
          const threshold = Math.ceil(Math.min(userAbility.length, majorAbility.length) / 2);
          return dist <= threshold;
        });
      });

      const matchScore = matchedAbilities.length;

      if (matchGrade && matchScore > 0) {
        results.push({
          faculty: faculty.name,
          major: major.name,
          score: matchScore,
          matchedAbilities
        });
      }
    });
  });

  console.log('Matching majors:', results);  // เพิ่มตรงนี้ดูผลลัพธ์

  return results.sort((a, b) => b.score - a.score).slice(0, 5);
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
  }  const intent = req.body.queryResult?.intent?.displayName || "";
  const params = req.body.queryResult?.parameters || {};
  const sessionId = req.body.session || "default-session";

   const session = await getSession(sessionId);
   session.sessionId = sessionId;  // เซ็ตที่นี่แค่ครั้งเดียว


  if (intent === "welcome") {
    return res.json({
      fulfillmentText: "สวัสดีค่ะ ยินดีต้อนรับสู่แชทบอทแนะนำคณะและสาขา กรุณาแจ้งชื่อของคุณค่ะ"
    });
  }

  if (intent === "get name") {
    const name = params.name || "คุณ";
    session.name = name;
    await saveSession(session);
    return res.json({
      fulfillmentText: `สวัสดีคุณ ${name} กรุณาระบุเกรดเฉลี่ยของคุณ (เช่น 3.5) โดยต้องไม่เกิน 4.0 ค่ะ`
    });
  }

  if (intent === "get grade") {
    const grade = params.grade;
    if (typeof grade !== "number" || grade < 0 || grade > 4) {
      return res.json({
        fulfillmentText: "กรุณาใส่เกรดเฉลี่ยให้ถูกต้อง (0.0 - 4.0)",
        outputContexts: [
          {
            name: `${sessionId}/contexts/awaiting-grade`,
            lifespanCount: 1
          }
        ]
      });
    }
    session.grade = grade;
    await saveSession(session);
    return res.json({
      fulfillmentText: `ขอบคุณค่ะ คุณได้เกรด ${grade} กรุณาระบุความสามารถหรือความถนัดของคุณ (เช่น เลข, วิทยาศาสตร์, คอมพิวเตอร์) คั่นด้วยเครื่องหมายคอมม่า`
    });
  }

if (intent === "get skills") {
  let abilities = params.ability;
  if (typeof abilities === "string") {
    abilities = abilities.split(",").map(a => a.trim());
  } else if (Array.isArray(abilities)) {
    abilities = abilities.flatMap(item => item.split(",").map(a => a.trim()));
  }
  
  abilities = abilities.filter(a => a.length > 0);
  abilities = [...new Set(abilities)];

  const grade = session.grade;
  const name = session.name;

  if (!grade) {
    return res.json({
      fulfillmentText: "กรุณาระบุเกรดก่อนค่ะ"
    });
  }

  if (abilities.length === 0) {
    return res.json({
      fulfillmentText: "กรุณาระบุความสามารถอย่างน้อย 1 อย่างค่ะ"
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
        fulfillmentText: `คำว่า "${invalid.join(", ")}" เราไม่เข้าใจ กรุณากรอกความสามารถใหม่อีกครั้งค่ะ`,
        outputContexts: [
          {
            name: `${sessionId}/contexts/awaiting-skills`,
            lifespanCount: 1
          }
        ]
      });
    }

    const results = findMatchingMajors(grade, validAbilities);

    if (results.length === 0) {
      return res.json({
        fulfillmentText: `ขออภัยคุณ ${name || 'ผู้ใช้'} ไม่พบคณะที่เหมาะสมกับคุณค่ะ`
      });
    }

    const abilitiesInputText = abilities.join(", ");

    let reply = `ขอบคุณค่ะคุณ${name || ''} จากข้อมูลที่คุณกรอกมามีดังนี้  \n` +
    `เกรดเฉลี่ย : ${grade}    \n` +
    `ความสามารถหรือความถนัดของคุณ : ${abilitiesInputText}  \n\n` +
    `เราขอแนะนำคณะและสาขาที่เหมาะสมกับคุณดังนี้ : \n`;

    results.forEach((r, i) => {
      const majorInfo = faculties
        .find(f => f.name === r.faculty)
        .majors.find(m => m.name === r.major);
    
      const requiredGrade = majorInfo.grade !== null ? majorInfo.grade : 'ไม่ระบุ';
      const allAbilitiesText = majorInfo.ability.join(", ");
      const matchedAbilitiesText = r.matchedAbilities.join(", ");
      const quotaText = majorInfo.quota ? `   - รับจำนวน : ${majorInfo.quota} คน\n` : "";
      const conditionText = majorInfo.condition ? `   - คุณสมบัติ : ${majorInfo.condition}\n` : "";
      const reasonText = majorInfo.reason ? `   - เหตุผลที่เหมาะสม : ${majorInfo.reason}\n` : "";
    
      reply += `🎓 อันดับที่ ${i + 1} ${r.faculty}\n` +
               `   - สาขา : ${r.major}\n` +
               `   - เกรดเฉลี่ยขั้นต่ำที่กำหนด : ${requiredGrade}\n` +
               `   - ทักษะความสามารถ : ${allAbilitiesText}\n` +
               `   - ความสามารถของคุณที่ตรงกับสาขานี้ : ${matchedAbilitiesText}\n` +
               quotaText +
               conditionText +
               reasonText +
               `\n`;
    });


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
    allAbilities: majorInfo.ability.join(", "),
    matchedAbilities: r.matchedAbilities.join(", ")
  };
});

// บันทึกลง MongoDB
await session.save();
        return res.json({
      fulfillmentText: reply
    });
  }

  return res.json({
    fulfillmentText: "ขออภัย ไม่เข้าใจคำสั่ง กรุณาลองใหม่"
  });
});

// --- เริ่มเพิ่มโค้ด LINE bot ที่นี่ ---
// สำหรับ LINE webhook ต้องใช้ express.raw() เพื่อให้ middleware ตรวจสอบ signature ได้ถูกต้อง
app.post('/linewebhook',
  express.raw({ type: 'application/json' }), // ต้อง parse raw body แบบนี้ก่อน
  line.middleware(lineConfig),
  async (req, res) => {
    try {
      const events = req.body.events;
      // ทำงานกับ events ตามที่คุณเขียนไว้
      // ตัวอย่าง
      await Promise.all(events.map(async (event) => {
        if (event.type === 'message' && event.message.type === 'text') {
          const userMessage = event.message.text;
          const sessionId = event.source.userId || uuid.v4();  // LINE user ID ใช้แทน session
          const dialogflowResult = await detectIntentText(sessionId, userMessage);
        
          const replyText = dialogflowResult.fulfillmentText || 'ขออภัย ฉันไม่เข้าใจค่ะ';
        
          await lineClient.replyMessage(event.replyToken, {
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
