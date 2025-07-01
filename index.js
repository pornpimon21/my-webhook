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

// ข้อมูลคณะและสาขา
const faculties = [
  {
    name: 'คณะครุศาสตร์',
    majors: [
{
        name : 'ภาษาไทย',
        grade : 2.75,
        ability : ['ภาษาไทย', 'สอน', 'ครู', 'รักเด็ก', 'เข้าใจในการสอน', 'การเขียน', 'สื่อสาร', 'วรรณกรรม', 'การอ่าน', 'จับใจความ', 'ไวยากรณ์', 'เรียบเรียง'],
        quota : 60,
        requiredEducation: ['มัธยมปลาย', 'ปวช', 'กศน'],
        condition : "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน เกรดวิชาภาษาไทยไม่ต่ำกว่า 3.0",
        reason : 'คุณมีความสามารถด้านภาษาไทย และรักในการสื่อสารผ่านภาษา เหมาะกับการถ่ายทอดความรู้ทางภาษาให้ผู้อื่น',
        careers: ["ครูสอนภาษาไทย","นักเขียน","บรรณาธิการ"]
      },
      {
        name : 'วิทยาศาสตร์ทั่วไป', 
        grade : 2.50, 
        ability : ['วิทยาศาสตร์', 'เคมี', 'ฟิสิกส์', 'ชีววิทยา', 'แล็บ'], 
        quota : 60, 
        requiredEducation: ['มัธยมปลาย', 'ปวช'],
        condition : "มัธยมศึกษาตอนปลายหรือเทียบเท่าสาขาทางวิทย์-คณิต, หรือสาขาที่เกี่ยวข้องกับวิทยาศาสตร์",
        reason : 'คุณมีความสามารถด้านวิทยาศาสตร์ ',
        careers: ["นักวิชาการ","นักเคมี","นักฟิสิกส์"]
      }    
    ]
  },
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

//จับคู่คณะและสาขา
function findMatchingMajors(grade, abilities, educationLevel) {
  let results = [];

  faculties.forEach(faculty => {
    faculty.majors.forEach(major => {
      if (grade < major.grade) return;

      if (!major.requiredEducation.includes(educationLevel)) return;

      const matchedAbilities = major.ability.filter(majorAbility => {
        return abilities.some(userAbility => {
          const dist = levenshtein.get(userAbility, majorAbility);
          const threshold = Math.ceil(Math.min(userAbility.length, majorAbility.length) / 2);
          return dist <= threshold;
        });
      });

      if (matchedAbilities.length === 0) return;

      results.push({
        faculty: faculty.name,
        major: major.name,
        matchedAbilities,
        condition: major.condition,
      });
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

  if (intent === "welcome") {
    return res.json({
      fulfillmentText: "🌟 สวัสดีค่ะ!\nยินดีต้อนรับสู่ระบบแนะนำคณะและสาขา 🎓\n\nเราพร้อมช่วยคุณค้นหาคณะที่เหมาะสมที่สุด\nเพื่อเริ่มต้น กรุณาพิมพ์ \"ชื่อของคุณ\" เข้ามาก่อนนะคะ 😊"
    });
  }

  if (intent === "get name") {
    const name = params.name || "คุณ";
    session.name = name;
    await saveSession(session);
    return res.json({
    fulfillmentText: `✨ สวัสดีค่ะ คุณ${name}\n\nกรุณาเลือกระดับการศึกษาของคุณ\n(มัธยมปลาย, ปวช, ปวส, กศน)`
    });
  }

if (intent === "educationLevel") {
  const educationLevel = (params.educationLevel || "").toLowerCase();
  session.educationLevel = educationLevel;
  await saveSession(session);

  if (["มัธยมปลาย", "ปวช", "ปวส", "กศน"].includes(educationLevel)) {
    return res.json({
      fulfillmentText: "กรุณากรอกเกรดเฉลี่ยของคุณค่ะ",
      outputContexts: [{
        name: `${sessionFull}/contexts/ask_grad`,
        lifespanCount: 2
      }]
    });
  } else {
    return res.json({
      fulfillmentText: "ขอโทษค่ะ กรุณาเลือกระดับการศึกษาใหม่อีกครั้ง (มัธยมปลาย, ปวช, ปวส, กศน)",
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
      fulfillmentText: `🙏 ขอบคุณค่ะ คุณได้เกรด ${grade}\nกรุณาระบุความสามารถหรือความถนัดของคุณ เช่น คอมพิวเตอร์ คณิตศาสตร์ การแสดง วาดรูป กีฬา เป็นต้น 🚀`,
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
    careersText = "💼 อาชีพที่เกี่ยวข้อง\n";
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
session.educationLevel = educationLevel; // เพิ่มระดับการศึกษาที่เลือก (ต้องดึงจาก params)
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
    careers: majorInfo.careers
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
        if (event.type === 'message' && event.message.type === 'text') {
          const userMessage = event.message.text;
          const sessionId = event.source.userId || uuid.v4();  // LINE user ID ใช้แทน session

if (userMessage === 'เริ่มแนะนำใหม่') {
  // ดึง session จาก MongoDB แทน
  let session = await Session.findOne({ sessionId: sessionId });

  if (session && session.name && session.grade) {
    session.abilitiesInputText = '';
    session.recommendations = [];

    // บันทึก session ที่แก้ไข
    await session.save();

    await lineClient.replyMessage(event.replyToken, {
    type: 'text',
    text: `🔄 มาเริ่มแนะนำกันใหม่จากข้อมูลเดิมนะคะ!
    👤 ชื่อ : ${session.name}
    📊 เกรด : ${session.grade}
    กรุณาพิมพ์ความสามารถหรือกิจกรรมที่คุณถนัด เช่น คอมพิวเตอร์ คณิต การแสดง เป็นต้น `
    });
    return;
  } else {
    await lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: '⚠️ ขอโทษค่ะ ไม่พบข้อมูลเก่าของคุณ กรุณากดคลิก "แนะนะคณะ" เพื่อเริ่มต้นใหม่ค่ะ'
    });
    return;
  }
}

// ฟังก์ชันช่วยตรวจสอบข้อความ ให้รองรับทั้ง string และ number
const safeText = (text) => {
  if (typeof text === 'string' && text.trim() !== '') return text;
  if (typeof text === 'number') return text.toString();
  return 'ไม่ระบุ';
};

const safeArray = (arr) =>
  Array.isArray(arr) && arr.length > 0 ? arr : ['ไม่ระบุ'];

// STEP 1: คำสั่ง "ค้นหาข้อมูล" -> แสดง Flex Message เลือกคณะ
if (userMessage === 'ค้นหาข้อมูล') {
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

  await lineClient.replyMessage(event.replyToken, [
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

// STEP 2: เลือกคณะ -> แสดง Flex Message เลือกสาขา
const selectedFaculty = faculties.find(f => f.name === userMessage);
if (selectedFaculty) {
  const majorBubbles = selectedFaculty.majors.map((major, index) => {
    // หา emoji ตามชื่อสาขา (ตรวจสอบว่า major.name มีคำใดใน map หรือไม่)
    let emoji = "";
    for (const key in majorEmojiMap) {
      if (major.name.includes(key)) {
        emoji = majorEmojiMap[key];
        break;  // หยุดที่ตัวแรกที่เจอ
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
            text: major.name,  // แสดงชื่อเต็มของสาขา            
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
            color: index % 2 === 0 ? "#FFA500" : "#FFD700",
            action: {
              type: "message",
              label: emoji,
              text: major.name
            }
          }
        ],
        paddingAll: "10px",
        spacing: "sm"
      }
    };
  });

  await lineClient.replyMessage(event.replyToken, [
    {
      type: 'text',
      text: `🎓 กรุณาเลือกสาขาที่สนใจใน\n"${selectedFaculty.name}" ด้านล่างนี้ค่ะ 😊`
    },
    {
      type: "flex",
      altText: `กรุณาเลือกสาขาใน "${selectedFaculty.name}"`,
      contents: {
        type: "carousel",
        contents: majorBubbles
      }
    }
  ]);
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

  const careersContents = careersArray.map(career => ({
    type: "text",
    text: `• ${career}`,
    size: "sm",
    wrap: true
  }));

  const bubble = {
    type: "bubble",
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
    { type: "text", text: "🧠 รับจำนวน", size: "sm", weight: "bold", margin: "md" },
    { type: "text", text: quotaText, size: "sm", wrap: true },

    // คุณสมบัติ
    { type: "text", text: "📌 เงื่อนไข", size: "sm", weight: "bold", margin: "md" },
    { type: "text", text: conditionText, size: "sm", wrap: true },

    // อาชีพ
    { type: "text", text: "🎯 อาชีพที่เกี่ยวข้อง", size: "sm", weight: "bold", margin: "md" },
    ...careersContents
  ] 
    },
    footer: {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "button",
          style: "primary",
          action: {
            type: "message",
            label: "เริ่มใหม่",
            text: "ค้นหาข้อมูล"
          }
        }
      ]
    }
  };

  console.log("✅ Bubble Payload:", JSON.stringify(bubble, null, 2));

  await lineClient.replyMessage(event.replyToken, {
    type: "flex",
    altText: `ข้อมูลสาขา ${safeText(matchedMajor?.name)}`.slice(0, 400),
    contents: bubble
  });
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
                      `📘 เกรดเฉลี่ย : ${session.grade}\n` +
                      `🧠 ความสามารถหรือความถนัดของคุณ : ${session.abilitiesInputText}\n\n` +
                      `🎯 เราขอแนะนำคณะและสาขาที่เหมาะสมกับคุณ 5 ลำดับดังนี้ค่ะ 👇 `;              
              // สร้าง Flex Message carousel
              const bubbles = session.recommendations.map((rec) => {
                return {
                  type: "bubble",
                  size: "mega", 
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
                        text: rec.abilities && rec.abilities.length > 0 ? `${rec.abilities.join(", ")}` : "ไม่ระบุ",
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
                        text: rec.matchedAbilities && rec.matchedAbilities.length > 0 ? `${rec.matchedAbilities.join(", ")}` : "ไม่ระบุ",
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
                        text: rec.condition ? rec.condition : "ไม่ระบุ",
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
                        text: rec.reason ? rec.reason : "ไม่ระบุ",
                        size: "sm",
                        wrap: true,
                        margin: "xs"
                      },
                      {
                        type: "text",
                        text: `💼 อาชีพที่เกี่ยวข้อง`,
                        weight: "bold",
                        margin: "md",
                        size: "sm"
                      },
                      ...((rec.careers && rec.careers.length > 0) ?
                        rec.careers.map(career => ({
                          type: "text",
                          text: `• ${career}`,
                          size: "sm",
                          margin: "xs",
                          wrap: true
                        }))
                        : [{
                          type: "text",
                          text: "ไม่ระบุ",
                          size: "sm",
                          margin: "xs"
                        }]
                      )
                    ]
                  },
                  footer: {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {
                        type: "button",
                        style: "primary",
                        action: {
                          type: "message",
                          label: "เริ่มใหม่",
                          text: "เริ่มแนะนำใหม่"
                        }
                      }
                    ]
                  }
                };
              });

// 1. ส่งข้อความแนะนำก่อน
await lineClient.replyMessage(event.replyToken, {
  type: 'text',
  text: introText
});

// 2. ใช้ pushMessage เพื่อแสดง bubble carousel (ทั้งหมด)
await lineClient.pushMessage(event.source.userId, {
  type: "flex",
  altText: "ผลลัพธ์แนะนำคณะและสาขา",
  contents: {
    type: "carousel",
    contents: bubbles
  }
});  
  return;  // หยุดโค้ดตรงนี้เพื่อไม่ส่งข้อความอื่นซ้ำ
            } else {
              // กรณี session ไม่มี recommendations
              await lineClient.replyMessage(event.replyToken, {
                type: "text",
                text: "⚠️ ขออภัยค่ะไม่มีข้อมูลแนะนำในขณะนี้ 🙇‍♀️"
              });
              return;
            }
          }

          // กรณีทั่วไป ตอบข้อความธรรมดา
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