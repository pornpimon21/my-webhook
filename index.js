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

// ใช้ json middleware สำหรับ webhook dialogflow
app.use(express.json());

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

// ข้อมูลคณะและสาขา (เหมือนเดิม)
const faculties = [
  {
    name: 'คณะครุศาสตร์',
    majors: [
      {
        name : 'ภาษาไทย',
        grade : 2.75,
        ability : ['ภาษาไทย', 'สอน', 'ครู', 'รักเด็ก', 'เข้าใจในการสอน', 'การเขียน', 'สื่อสาร', 'วรรณกรรม', 'การอ่าน', 'จับใจความ', 'ไวยากรณ์', 'เรียบเรียง'],
        quota : 60,
        condition : "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน เกรดวิชาภาษาไทยไม่ต่ำกว่า 3.0",
        reason : 'คุณมีความสามารถด้านภาษาไทย และรักในการสื่อสารผ่านภาษา เหมาะกับการถ่ายทอดความรู้ทางภาษาให้ผู้อื่น',
        careers: ["ครูสอนภาษาไทย","นักเขียน","บรรณาธิการ"]
      },
      {
        name : 'วิทยาศาสตร์ทั่วไป', 
        grade : 2.50, 
        ability : ['วิทยาศาสตร์', 'เคมี', 'ฟิสิกส์', 'ชีววิทยา', 'แล็บ'], 
        quota : 60, 
        condition : "มัธยมศึกษาตอนปลายหรือเทียบเท่าสาขาทางวิทย์-คณิต, หรือสาขาที่เกี่ยวข้องกับวิทยาศาสตร์",
        reason : 'คุณมีความสามารถด้านวิทยาศาสตร์ ',
        careers: ["นักวิชาการ","นักเคมี","นักฟิสิกส์"]
      }    
    ]
  },
];

// ฟังก์ชันเปรียบเทียบความใกล้เคียง (เหมือนเดิม)
function findClosestAbility(userInput, thresholdRatio = 0.5) {
  userInput = userInput.trim().toLowerCase();
  const allAbilities = [...new Set(faculties.flatMap(f => f.majors.flatMap(m => m.ability)))].map(a => a.trim().toLowerCase());

  if (allAbilities.includes(userInput)) return userInput;

  // prefix match
  const prefixMatch = allAbilities.find(a => a.startsWith(userInput));
  if (prefixMatch) return prefixMatch;

  // partial match
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

// ฟังก์ชันจับคู่สาขา (เหมือนเดิม)
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

// ฟังก์ชันสร้าง Flex Carousel สำหรับผลลัพธ์ LINE
function generateFlexCarousel(recommendations) {
  if (!recommendations || recommendations.length === 0) {
    return {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "ไม่พบข้อมูลแนะนำคณะ",
            size: "lg",
            weight: "bold"
          }
        ]
      }
    };
  }

 return {
    type: "carousel",
    contents: recommendations.map((rec, index) => ({
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `🎓 อันดับที่ ${index + 1}`,
            weight: "bold",
            color: "#1DB446",
            size: "lg"
          },
          {
            type: "text",
            text: `${rec.faculty} - ${rec.major}`,
            weight: "bold",
            size: "md",
            wrap: true
          }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: `📊 เกรดขั้นต่ำ: ${rec.minGrade ?? "N/A"}`,
            wrap: true
          },
          {
            type: "text",
            text: `🛠️ ทักษะ: ${rec.skills?.join(", ") ?? "N/A"}`,
            wrap: true
          },
          {
            type: "text",
            text: `✅ ตรงกับคุณ: ${rec.matchedAbilities}`,
            wrap: true
          },
          {
            type: "text",
            text: `👥 รับจำนวน : ${rec.capacity ?? "N/A"} คน`,
            wrap: true
          },
          {
            type: "text",
            text: `📄 คุณสมบัติ : ${rec.qualifications ?? "N/A"}`,
            wrap: true
          },
          {
            type: "text",
            text: `💡 เหตุผลที่เหมาะสม : ${rec.reason ?? "N/A"}`,
            wrap: true
          },
          {
            type: "text",
            text: `💼 อาชีพที่เกี่ยวข้อง\n• ${rec.careers.join("\n• ")}`,
            wrap: true
          }
        ]
      }
    }))
  };
}

// Webhook Dialogflow
app.post("/webhook", async (req, res) => {
  const eventId = req.body.originalDetectIntentRequest?.payload?.data?.webhookEventId;

  if (eventId) {
    try {
      const exists = await EventLog.findOne({ eventId });
      if (exists) {
        return res.status(200).send();
      }
      await EventLog.create({ eventId });
    } catch (err) {
      console.error("❌ EventLog error:", err.message);
    }
  }

  const intent = req.body.queryResult?.intent?.displayName || "";
  const params = req.body.queryResult?.parameters || {};
  const sessionId = req.body.session || "default-session";

  const session = await getSession(sessionId);
  session.sessionId = sessionId;

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
      fulfillmentText: `ขอบคุณค่ะ คุณได้เกรด ${grade} กรุณาระบุความสามารถหรือความถนัดของคุณ (เช่น เลข วิทยาศาสตร์ คอมพิวเตอร์)`
    });
  }

  if (intent === "get skills") {
    let abilities = params.ability;
    if (typeof abilities === "string") {
      abilities = abilities.split(/[,\s]+/).map(a => a.trim());
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
      });
    }

    const results = findMatchingMajors(grade, validAbilities);

    if (results.length === 0) {
      return res.json({
        fulfillmentText: `ขออภัยคุณ ${name || 'ผู้ใช้'} ไม่พบคณะที่เหมาะสมกับคุณค่ะ`
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

      let careersText = "";
      if (majorInfo.careers && majorInfo.careers.length > 0) {
        careersText = "💼 อาชีพที่เกี่ยวข้อง\n";
        careersText += majorInfo.careers.map(career => `  • ${career}`).join("\n") + "\n";
      }

      reply += `\n━━━━━━━━━━━━━━━━━━━━\n` + 
               `🎓 อันดับที่ ${i + 1} ${r.faculty}\n` +
               `🏫 สาขา : ${r.major}\n` +
               `📊 เกรดเฉลี่ยขั้นต่ำที่กำหนด : ${requiredGrade}\n` +
               `🛠️ ทักษะความสามารถ : ${allAbilitiesText}\n` +
               `✅ ความสามารถของคุณที่ตรงกับสาขานี้ : ${matchedAbilitiesText}\n` +
               quotaText +
               conditionText +
               reasonText +
               careersText;
    });

    reply += `\n✨ ขอให้โชคดีกับการเลือกคณะนะคะ!`;

    // บันทึกข้อมูลลง session
    session.name = name;
    session.grade = grade;
    session.abilitiesInputText = abilities.join(", ");
    session.recommendations = results.map((r, i) => {
      const majorInfo = faculties
        .find(f => f.name === r.faculty)
        .majors.find(m => m.name === r.major);

      return {
        rank: i + 1,
        faculty: r.faculty,
        major: r.major,
        allAbilities: majorInfo.ability.join(", "),
        careers: majorInfo.careers || [],
        matchedAbilities: r.matchedAbilities.join(", ")
      };
    });

    await session.save();

    return res.json({
      fulfillmentText: reply
    });
  }

  return res.json({
    fulfillmentText: "ขออภัย ไม่เข้าใจคำสั่ง กรุณาลองใหม่"
  });
});

// --- โค้ด LINE bot ---

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
          const userId = event.source.userId;

          // sessionId ใช้ userId ของ LINE
          const sessionId = userId;
          const session = await getSession(sessionId);

          // ถ้า user ยังไม่กรอกเกรด และ session ไม่มี grade ให้ถามก่อน
          if (!session.grade) {
            // พยายามแปลงข้อความเป็นเกรด
            const gradeInput = parseFloat(userMessage);
            if (!isNaN(gradeInput) && gradeInput >= 0 && gradeInput <= 4) {
              session.grade = gradeInput;
              await saveSession(session);
              await lineClient.replyMessage(event.replyToken, {
                type: 'text',
                text: `บันทึกเกรด ${gradeInput} เรียบร้อยค่ะ กรุณาระบุความสามารถหรือความถนัดของคุณ (เช่น ภาษาไทย, คณิตศาสตร์, วิทยาศาสตร์)`
              });
            } else {
              await lineClient.replyMessage(event.replyToken, {
                type: 'text',
                text: 'กรุณากรอกเกรดเฉลี่ยของคุณเป็นตัวเลขตั้งแต่ 0.0 ถึง 4.0 ค่ะ'
              });
            }
            return;
          }

          // ถ้า session มี grade แต่ยังไม่มี abilitiesInputText
          if (!session.abilitiesInputText) {
            // แยกคำความสามารถจากข้อความ user
            let abilities = userMessage.split(/[,\s]+/).map(a => a.trim()).filter(a => a.length > 0);

            // ตรวจสอบความสามารถที่ใกล้เคียง
            let validAbilities = new Set();
            let invalidAbilities = [];

            abilities.forEach(a => {
              const closest = findClosestAbility(a);
              if (closest) validAbilities.add(closest);
              else invalidAbilities.push(a);
            });

            if (invalidAbilities.length > 0) {
              await lineClient.replyMessage(event.replyToken, {
                type: 'text',
                text: `คำว่า "${invalidAbilities.join(", ")}" เราไม่เข้าใจ กรุณาระบุความสามารถอีกครั้งค่ะ`
              });
              return;
            }

            validAbilities = Array.from(validAbilities);

            const results = findMatchingMajors(session.grade, validAbilities);

            if (results.length === 0) {
              await lineClient.replyMessage(event.replyToken, {
                type: 'text',
                text: 'ขออภัยไม่พบคณะที่เหมาะสมกับคุณค่ะ'
              });
              return;
            }

            // บันทึกข้อมูล
            session.abilitiesInputText = abilities.join(", ");
            session.recommendations = results.map((r, i) => {
              const majorInfo = faculties
                .find(f => f.name === r.faculty)
                .majors.find(m => m.name === r.major);

              return {
                rank: i + 1,
                faculty: r.faculty,
                major: r.major,
                allAbilities: majorInfo.ability.join(", "),
                careers: majorInfo.careers || [],
                matchedAbilities: r.matchedAbilities.join(", ")
              };
            });

            await saveSession(session);

            // สร้าง Flex Message
            const flexMessage = {
              type: "flex",
              altText: "แนะนำคณะและสาขา",
              contents: generateFlexCarousel(session.recommendations)
            };

            await lineClient.replyMessage(event.replyToken, flexMessage);

            return;
          }

          // ถ้า session มีครบแล้ว ให้ตอบข้อความตามต้องการ หรือรีเซ็ต session
          await lineClient.replyMessage(event.replyToken, {
            type: 'text',
            text: 'ขอบคุณค่ะ หากต้องการเริ่มต้นใหม่ กรุณาพิมพ์ "เริ่มใหม่"'
          });
        }

        // ถ้า user ส่งข้อความอื่นนอกจาก text
        else {
          await lineClient.replyMessage(event.replyToken, {
            type: 'text',
            text: 'กรุณาส่งข้อความเป็นข้อความตัวอักษรเท่านั้นค่ะ'
          });
        }
      }));

      res.status(200).send('OK');
    } catch (error) {
      console.error('LINE webhook error:', error);
      res.status(500).send('Error');
    }
  });

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
