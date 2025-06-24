require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const levenshtein = require('fast-levenshtein');
const line = require('@line/bot-sdk');
const { SessionsClient } = require('@google-cloud/dialogflow');
const uuid = require('uuid');
const fs = require('fs');
const path = require('path');

const Session = require('./models/session');       // Mongoose schema for session
const EventLog = require('./models/eventLog');     // Mongoose schema for event log

const app = express();
const PORT = process.env.PORT || 3000;

// --- Setup Dialogflow key from base64 env ---
const keyPath = path.join(__dirname, 'dialogflow-key.json');
if (!fs.existsSync(keyPath) && process.env.GOOGLE_CREDENTIALS_BASE64) {
  const buffer = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64');
  fs.writeFileSync(keyPath, buffer);
  console.log('✅ Created dialogflow-key.json from base64!');
}
process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;

// --- Connect to MongoDB ---
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// --- LINE SDK setup ---
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const lineClient = new line.Client(lineConfig);

// --- Dialogflow client ---
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

// --- Data: faculties and majors (sample) ---
const faculties = [
  {
    name: 'คณะครุศาสตร์',
    majors: [
      {
        name: 'ภาษาไทย',
        grade: 2.75,
        ability: ['ภาษาไทย', 'สอน', 'ครู', 'รักเด็ก', 'เข้าใจในการสอน', 'การเขียน', 'สื่อสาร', 'วรรณกรรม', 'การอ่าน', 'จับใจความ', 'ไวยากรณ์', 'เรียบเรียง'],
        quota: 60,
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน เกรดวิชาภาษาไทยไม่ต่ำกว่า 3.0",
        reason: 'คุณมีความสามารถด้านภาษาไทย และรักในการสื่อสารผ่านภาษา เหมาะกับการถ่ายทอดความรู้ทางภาษาให้ผู้อื่น',
        careers: ["ครูสอนภาษาไทย", "นักเขียน", "บรรณาธิการ"],
      },
      {
        name: 'วิทยาศาสตร์ทั่วไป',
        grade: 2.50,
        ability: ['วิทยาศาสตร์', 'เคมี', 'ฟิสิกส์', 'ชีววิทยา', 'แล็บ'],
        quota: 60,
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าสาขาทางวิทย์-คณิต, หรือสาขาที่เกี่ยวข้องกับวิทยาศาสตร์",
        reason: '',
        careers: ["นักวิชาการ", "นักเคมี", "นักฟิสิกส์"],
      },
    ],
  },
];

// --- Utility functions ---
function findClosestAbility(userInput, thresholdRatio = 0.5) {
  userInput = userInput.trim().toLowerCase();
  const allAbilities = [...new Set(faculties.flatMap(f => f.majors.flatMap(m => m.ability)))].map(a => a.trim().toLowerCase());

  if (allAbilities.includes(userInput)) return userInput;

  const prefixMatch = allAbilities.find(a => a.startsWith(userInput));
  if (prefixMatch) return prefixMatch;

  const partialMatch = allAbilities.find(a => a.includes(userInput));
  if (partialMatch) return partialMatch;

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

      if (matchGrade && matchedAbilities.length > 0) {
        results.push({
          faculty: faculty.name,
          major: major.name,
          score: matchedAbilities.length,
          matchedAbilities,
        });
      }
    });
  });

  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}

// --- MongoDB helpers ---
async function getSession(sessionId) {
  let session = await Session.findOne({ sessionId });
  if (!session) session = new Session({ sessionId });
  return session;
}

async function saveSession(session) {
  await session.save();
}

// --- Webhook endpoint for Dialogflow fulfillment ---
app.use('/webhook', express.json());
app.post('/webhook', async (req, res) => {
  try {
    const eventId = req.body.originalDetectIntentRequest?.payload?.data?.webhookEventId;
    if (eventId) {
      const existEvent = await EventLog.findOne({ eventId });
      if (existEvent) return res.status(200).send(); // already processed
      await EventLog.create({ eventId });
    }

    const intent = req.body.queryResult?.intent?.displayName || '';
    const params = req.body.queryResult?.parameters || {};
    const sessionId = req.body.session || 'default-session';

    const session = await getSession(sessionId);

    // Welcome intent
    if (intent === 'welcome') {
      return res.json({ fulfillmentText: "สวัสดีค่ะ ยินดีต้อนรับสู่แชทบอทแนะนำคณะและสาขา กรุณาแจ้งชื่อของคุณค่ะ" });
    }

    // Get Name
    if (intent === 'get name') {
      const name = params.name || 'คุณ';
      session.name = name;
      await saveSession(session);
      return res.json({
        fulfillmentText: `สวัสดีคุณ ${name} กรุณาระบุเกรดเฉลี่ยของคุณ (เช่น 3.5) โดยต้องไม่เกิน 4.0 ค่ะ`
      });
    }

    // Get Grade
    if (intent === 'get grade') {
      const grade = params.grade;
      if (typeof grade !== 'number' || grade < 0 || grade > 4) {
        return res.json({
          fulfillmentText: "กรุณาใส่เกรดเฉลี่ยให้ถูกต้อง (0.0 - 4.0)",
          outputContexts: [{ name: `${sessionId}/contexts/awaiting-grade`, lifespanCount: 1 }],
        });
      }
      session.grade = grade;
      await saveSession(session);
      return res.json({
        fulfillmentText: `ขอบคุณค่ะ คุณได้เกรด ${grade} กรุณาระบุความสามารถหรือความถนัดของคุณ (เช่น เลข วิทยาศาสตร์ คอมพิวเตอร์)`,
      });
    }

    // Get Skills / abilities
    if (intent === 'get skills') {
      let abilities = params.ability;
      if (typeof abilities === 'string') {
        abilities = abilities.split(/[,\s]+/).map(a => a.trim());
      } else if (Array.isArray(abilities)) {
        abilities = abilities.flatMap(item => item.split(',').map(a => a.trim()));
      }
      abilities = abilities.filter(a => a.length > 0);
      abilities = [...new Set(abilities)];

      const grade = session.grade;
      const name = session.name;

      if (!grade) {
        return res.json({ fulfillmentText: "กรุณาระบุเกรดก่อนค่ะ" });
      }
      if (abilities.length === 0) {
        return res.json({ fulfillmentText: "กรุณาระบุความสามารถอย่างน้อย 1 อย่างค่ะ" });
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
          fulfillmentText: `คำว่า "${invalid.join(', ')}" เราไม่เข้าใจ กรุณากรอกความสามารถใหม่อีกครั้งค่ะ`,
        });
      }

      const results = findMatchingMajors(grade, validAbilities);
      if (results.length === 0) {
        return res.json({
          fulfillmentText: `ขออภัยคุณ ${name || 'ผู้ใช้'} ไม่พบคณะที่เหมาะสมกับคุณค่ะ`,
        });
      }

      const abilitiesInputText = abilities.join(', ');
      let reply = `🙏 ขอบคุณค่ะคุณ${name || ''} จากข้อมูลที่คุณกรอกมามีดังนี้  \n` +
        `📘 เกรดเฉลี่ย : ${grade}    \n` +
        `🧠 ความสามารถหรือความถนัดของคุณ : ${abilitiesInputText}  \n\n` +
        `เราขอแนะนำคณะและสาขาที่เหมาะสมกับคุณดังนี้ : \n`;

      results.forEach((r, i) => {
        const majorInfo = faculties
          .find(f => f.name === r.faculty)
          .majors.find(m => m.name === r.major);

        reply += `\n━━━━━━━━━━━━━━━━━━━━\n` +
          `🎓 อันดับที่ ${i + 1} ${r.faculty}\n` +
          `   🏫 สาขา : ${r.major}\n` +
          `   📊 เกรดเฉลี่ยขั้นต่ำที่กำหนด : ${majorInfo.grade !== null ? majorInfo.grade : 'ไม่ระบุ'}\n` +
          `   🛠️ ทักษะความสามารถ : ${majorInfo.ability.join(', ')}\n` +
          `   ✅ ความสามารถของคุณที่ตรงกับสาขานี้ : ${r.matchedAbilities.join(', ')}\n` +
          (majorInfo.quota ? `   👥 รับจำนวน : ${majorInfo.quota} คน\n` : '') +
          (majorInfo.condition ? `   📄 คุณสมบัติ : ${majorInfo.condition}\n` : '') +
          (majorInfo.reason ? `   💡 เหตุผลที่เหมาะสม : ${majorInfo.reason}\n` : '');
      });

      reply += `\n✨ ขอให้โชคดีกับการเลือกคณะนะคะ!`;

      // Save session data
      session.abilitiesInputText = abilitiesInputText;
      session.recommendations = results.map((r, i) => {
        const majorInfo = faculties
          .find(f => f.name === r.faculty)
          .majors.find(m => m.name === r.major);
        return {
          rank: i + 1,
          faculty: r.faculty,
          major: r.major,
          allAbilities: majorInfo.ability.join(', '),
          careers: majorInfo.careers || [],
          matchedAbilities: r.matchedAbilities.join(', '),
        };
      });
      await saveSession(session);

      return res.json({ fulfillmentText: reply });
    }

    // Fallback response
    return res.json({ fulfillmentText: "ขออภัย ไม่เข้าใจคำสั่ง กรุณาลองใหม่" });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Internal Server Error');
  }
});

// ฟังก์ชันสร้างปุ่มอาชีพ
function createCareerButtons(recommendations) {
  if (!recommendations || recommendations.length === 0) return null;

  const rec = recommendations[0];

  if (!rec.careers || rec.careers.length === 0) return null;

  const actions = rec.careers.slice(0, 4).map(career => ({
    type: 'message',
    label: career.length > 20 ? career.slice(0, 17) + '...' : career,
    text: `อาชีพ: ${career}`
  }));

  return {
    type: 'template',
    altText: `อาชีพที่เกี่ยวข้องกับ ${rec.major}`,
    template: {
      type: 'buttons',
      title: `${rec.faculty} / ${rec.major}`,
      text: 'อาชีพที่เกี่ยวข้อง :',
      actions: actions
    }
  };
}

// --- LINE webhook ---
app.post('/linewebhook',
  express.raw({ type: 'application/json' }),
  line.middleware(lineConfig),
  async (req, res) => {
    try {
      const events = req.body.events;

      await Promise.all(events.map(async (event) => {
        if (event.type === 'message' && event.message.type === 'text') {
          const userMessage = event.message.text;
          const sessionId = event.source.userId || uuid.v4();

          if (userMessage === 'แนะนำคณะ') {
            // เรียก Dialogflow intent 'welcome' หรือข้อความแนะนำเบื้องต้น
            const dialogflowResult = await detectIntentText(sessionId, 'สวัสดี');

            // ตอบข้อความแนะนำคณะก่อน
            await lineClient.replyMessage(event.replyToken, {
              type: 'text',
              text: dialogflowResult.fulfillmentText
            });

            // ดึงข้อมูล session เพื่อดึงข้อมูลอาชีพที่แนะนำ
            const session = await Session.findOne({ sessionId });

            if (session?.recommendations?.length > 0) {
              const careerButtonsMessage = createCareerButtons(session.recommendations);

              if (careerButtonsMessage) {
                // ส่งข้อความปุ่มอาชีพไปยังผู้ใช้
                await lineClient.pushMessage(event.source.userId, careerButtonsMessage);
              } else {
                await lineClient.pushMessage(event.source.userId, {
                  type: 'text',
                  text: '❗️ ไม่พบข้อมูลอาชีพที่เกี่ยวข้อง'
                });
              }
            } else {
              await lineClient.pushMessage(event.source.userId, {
                type: 'text',
                text: '⚠️ ไม่พบข้อมูลการแนะนำคณะ'
              });
            }

            return;
          }

          // กรณีข้อความทั่วไป ส่งให้ Dialogflow วิเคราะห์ intent
          const dialogflowResult = await detectIntentText(sessionId, userMessage);
          const replyText = dialogflowResult.fulfillmentText || 'ขออภัย ฉันไม่เข้าใจค่ะ';

          await lineClient.replyMessage(event.replyToken, {
            type: 'text',
            text: replyText
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
// --- Start server ---
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
