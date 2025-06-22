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
        condition : "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน เกรดวิชาภาษาไทยไม่ต่ำกว่า 3.0",
        reason : 'คุณมีความสามารถด้านภาษาไทย และรักในการสื่อสารผ่านภาษา เหมาะกับการถ่ายทอดความรู้ทางภาษาให้ผู้อื่น',
        careers: [
          "ครูสอนภาษาไทย",
          "นักเขียน",
          "บรรณาธิการ"
        ]
      },
      {
        name : 'วิทยาศาสตร์ทั่วไป', 
        grade : 2.50, 
        ability : ['วิทยาศาสตร์', 'เคมี', 'ฟิสิกส์', 'ชีววิทยา', 'แล็บ'], 
        quota : 60, 
        condition : "มัธยมศึกษาตอนปลายหรือเทียบเท่าสาขาทางวิทย์-คณิต, หรือสาขาที่เกี่ยวข้องกับวิทยาศาสตร์",
        reason : '',
        careers: [
          "นักวิชาการ",
          "นักเคมี",
          "นักฟิสิกส์"
        ]
      },
      {
        name : 'การประถมศึกษา',
        grade : 2.75,
        ability : ['สอนเด็กประถม', 'บริหารห้องเรียน', 'ออกแบบการเรียนการสอน', 'สอน', 'ครู', 'รักเด็ก', 'เข้าใจในการสอน'], 
        quota : 60,
        condition : "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      {
        name : 'ภาษาต่างประเทศ วิชาเอกภาษาอังกฤษ',
        grade : 2.75,
        ability :  ['การสื่อสาร', 'ภาษาอังกฤษ', 'สอน', 'ครู', 'รักเด็ก', 'เข้าใจในการสอน'],
        quota : 60,
        condition : "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      {
        name : 'ภาษาต่างประเทศ วิชาเอกภาษาจีน',
        grade : 2.50,
        ability :  ['การสื่อสาร', 'ภาษาจีน', 'สอน', 'ครู', 'รักเด็ก', 'เข้าใจในการสอน'], 
        quota : 60,
        condition : "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      {
        name : 'ภาษาต่างประเทศ วิชาเอกภาษาเกาหลี',
        grade : 2.50,
        ability :  ['การสื่อสาร', 'ภาษาเกาหลี', 'สอน', 'ครู', 'รักเด็ก', 'เข้าใจในการสอน'], 
        quota : 30,
        condition : "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'การศึกษาปฐมวัย', 
        grade : 2.75, 
        ability : ['รักเด็ก', 'อดทน', 'จัดกิจกรรมเด็ก', 'สอน', 'ครู', 'เข้าใจในการสอน'], 
        quota : 60, 
        condition : "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'คณิตศาสตร์', 
        grade : 3.00, 
        ability: ['เลข', 'คำนวณ', 'คณิต', 'สถิติ', 'แคลคูลัส', 'สอน', 'ครู', 'รักเด็ก', 'เข้าใจในการสอน'], 
        quota : 60, 
        condition : "มัธยมศึกษาตอนปลายหรือเทียบเท่าสาขาทางวิทย์-คณิต, ศิลป์-คำนวณหรือสาขาที่มีคณิตศาสตร์เพิ่มเติม",
        reason : ''
      },
      { 
        name : 'สังคมศึกษา', 
        grade : 2.75,
        ability: ['สังคม', 'สอนประวัติศาสตร์', 'พูด', 'การเมือง', 'มารยาท', 'เข้าสังคม', 'สอน', 'ครู', 'รักเด็ก', 'เข้าใจในการสอน'], 
        quota: 60, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'พลศึกษา', 
        grade : 2.75, 
        ability: ['กีฬา', 'ออกกำลังกาย', 'พูด', 'สอน', 'ครู', 'รักเด็ก', 'เข้าใจในการสอน'], 
        quota: 60, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'เกษตรศา่สตร์', 
        grade : 2.30, 
        ability: ['สิ่งแวดล้อม', 'การอนุรักษ์', 'ต้นไม้', 'สอน', 'ครู', 'รักเด็ก', 'เข้าใจในการสอน'], 
        quota: 60, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'นาฏศิลป์', 
        grade : 2.30, 
        ability: ['ดนตรี', 'การแสดง', 'เต้น', 'รำ', 'สอน', 'ครู', 'รักเด็ก', 'เข้าใจในการสอน'], 
        quota: 60, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'คอมพิวเตอร์และเทคโนโลยีดิจิทัลเพื่อการศึกษา วิชาเอกคอมพิวเตอร์', 
        grade : 2.50, 
        ability: ['เทคโนโลยี', 'คอมพิวเตอร์', 'ดิจิทัล', 'สอน', 'ครู', 'รักเด็ก', 'เข้าใจในการสอน'], 
        quota: 60, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'คอมพิวเตอร์และเทคโนโลยีดิจิทัลเพื่อการศึกษา วิชาเอกคอมพิวเตอร์และเทคโนโลยีดิจจิทัลเพื่อศึกษา', 
        grade : 2.50, 
        ability: ['เทคโนโลยี', 'คอมพิวเตอร์', 'ดิจิทัล', 'สอน', 'ครู', 'รักเด็ก', 'เข้าใจในการสอน'], 
        quota: 60, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
    ]
  },
  { name: 'คณะมนุษยศาสตร์และสังคมศาสตร์',
    majors: [
      { 
        name : 'การพัฒนาชุมชน', 
        grade : null, 
        ability: ['ช่วยเหลือสังคม', 'ทำงานชุมชน', 'ชุมชน', 'พัฒนา'], 
        quota: 20, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'รัฐประศาสนศาสตร์', 
        grade : null, 
        ability: ['สังคม', 'การเมือง', 'การปกครอง'], 
        quota: 50, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'ทัศนศิลป์', 
        grade : null, 
        ability: ['วาดรูป', 'วาดภาพ', 'สี', 'การออกแบบ', 'ความคิดสร้างสรรค์', 'ศิลป์'], 
        quota: 25, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'ภาษาอังกฤษ วิชาเอกภาษาอังกฤษ', 
        grade : null, 
        ability: ['การสื่อสาร', 'ภาษาอังกฤษ', 'วัฒนธรรมต่างประเทศ'], 
        quota: 25, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'ภาษาอังกฤษ วิชาเอกภาษาอังกฤษเพื่อการสื่อสารและการแปล', 
        grade : null, ability: ['การสื่อสาร', 'ภาษาอังกฤษ', 'แปลภาษา'], 
        quota: 25, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'ภาษาอังกฤษธุรกิจ (หลักสูตรนานาชาติ)', 
        grade : null, 
        ability: ['อินเตอร์', 'ธุรกิจ', 'การสื่อสาร', 'ภาษาอังกฤษ'], 
        quota: 20, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      }
    ]
  },
  { name: 'คณะวิทยาการจัดการ',
    majors: [
      { 
        name : 'เศรษฐกิจดิจิทัล', 
        grade : null, 
        ability: ['ดิจิทัล', 'ธุรกิจ', 'เศรษฐกิจ', 'การจัดการ'], 
        quota: 20, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'เศรษฐกิจดิจิทัล (เทียบโอน)', 
        grade : 2.00, 
        ability: ['ดิจิทัล', 'ธุรกิจ', 'เศรษฐกิจ', 'การจัดการ'], 
        quota: 20, 
        condition: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาทางด้านเทคโนโลยีธุรกิจดิจิทัล, ระบบสารสนเทศทางธุรกิจ, เทคโนโลยีสารสนเทศ, ดิจิทัลกราฟิก, หรือสาขาวิชาอื่นๆที่เกี่ยวข้อง",
        reason : ''
      },
      { 
        name : 'บัญชี', 
        grade : null, 
        ability: ['คำนวณ', 'ทำบัญชี', 'เลข', 'การจัดการ'], 
        quota: 40, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'บัญชี (เทียบโอน)', 
        grade : 2.00, 
        ability: ['คำนวณ', 'ทำบัญชี', 'เลข', 'การจัดการ'], 
        quota: 105, 
        condition: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาทางบัญชี",
        reason : ''
      },
      { 
        name : 'คอมพิวเตอร์ธุรกิจ', 
        grade : null, 
        ability: ['การจัดการ', 'ธุรกิจ', 'คอมพิวเตอร์'], 
        quota: 30, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'คอมพิวเตอร์ธุรกิจ (เทียบโอน)', 
        grade : 2.00, 
        ability: ['การจัดการ', 'ธุรกิจ', 'คอมพิวเตอร์'], 
        quota: 30, 
        condition: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาทางด้านเทคโนโลยีธุรกิจดิจิทัล, ระบบสารสนเทศทางธุรกิจ, เทคโนโลยีสารสนเทศ, ดิจิทัลกราฟิก, หรือสาขาวิชาอื่นๆที่เกี่ยวข้อง",
        reason : ''
      },
      { 
        name : 'นิเทศศาสตร์', 
        grade : null, 
        ability: ['การจัดการ', 'การแสดง', 'หน้าตา', 'สื่อสาร', 'การตลาด', 'ออกแบบ'], 
        quota: 30, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      }
    ]
  },
  { name : 'คณะวิทยาศาสตร์และเทคโนโลยี',
    majors: [
      { 
        name : 'เทคโนโลยีสารสนเทศ', 
        grade : null, ability: ['ไอที', 'IT', 'โปรแกรม', 'เขียนโปรแกรม', 'ออกแบบแอปพลิเคชัน', 'data', 'ข้อมูล', 'ฐานข้อมูล', 'คอมพิวเตอร์'], 
        quota: 30, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'เทคโนโลยีสารสนเทศ (เทียบโอน)', 
        grade : 2.00, 
        ability: ['ไอที', 'IT', 'โปรแกรม', 'เขียนโปรแกรม', 'ออกแบบแอปพลิเคชัน', 'data', 'ข้อมูล', 'ฐานข้อมูล', 'คอมพิวเตอร์'], 
        quota: 30, 
        condition: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาทางด้านคอมพิวเตอร์ หรือสาขาที่เกี่ยวข้อง",
        reason : ''
      },
      { 
        name : 'วิทยาการคอมพิวเตอร์', 
        grade : null, 
        ability: ['โค้ด', 'code', 'โปรแกรม', 'เขียนโปรแกรม', 'ออกแบบแอปพลิเคชัน', 'data', 'ข้อมูล', 'ฐานข้อมูล', 'คอมพิวเตอร์', 'เลข', 'คณิต', 'คำนวณ', 'เขียนเว็บ'], 
        quota: 30, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'วิทยาการคอมพิวเตอร์ (เทียบโอน)', 
        grade : 2.00, 
        ability: ['โค้ด', 'code', 'โปรแกรม', 'เขียนโปรแกรม', 'ออกแบบแอปพลิเคชัน', 'data', 'ข้อมูล', 'ฐานข้อมูล', 'คอมพิวเตอร์', 'เลข', 'คณิต', 'คำนวณ', 'เขียนเว็บ'], 
        quota: 30, 
        condition: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาทางด้านคอมพิวเตอร์ หรือสาขาที่เกี่ยวข้อง",
        reason : ''
      },
      { 
        name : 'สิ่งแวดล้อม', 
        grade : 2.00, 
        ability: ['สิ่งแวดล้อม', 'ต้นไม้', 'เกษตร', 'อนุรักษ์', 'ป่าไม้'], 
        quota: 15, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'อาหารและโภชนาการ', 
        grade : 2.00,
        ability: ['การจัดการ', 'ทำอาหาร', 'อาหาร', 'โภชนาการ', 'แคลอรี', 'ปรุงอาหาร'], 
        quota: 20, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'อาหารและโภชนาการ (เทียบโอน)', 
        grade : 2.50, 
        ability: ['การจัดการ', 'ทำอาหาร', 'อาหาร', 'โภชนาการ', 'แคลอรี', 'ปรุงอาหาร'], 
        quota: 10, 
        condition: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาเกี่ยวข้อง",
        reason : ''
      },
      { 
        name : 'วิทยาศาสตร์กีฬาและการออกกำลังกาย', 
        grade : null, 
        ability: ['กีฬา', 'ออกกำลังกาย', 'วิ่ง', 'ฝึกซ้อม'], 
        quota: 30, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'เคมี', 
        grade : null, 
        ability: ['วิทยาศาสตร์', 'เคมี', 'การทดลอง', 'วิจัย', 'สูตร', 'แล็บ'], 
        quota: 30, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'คณิตศาสตร์ประยุกต์', 
        grade : null, 
        ability: ['เลข', 'คำนวณ', 'คณิต', 'สถิติ', 'แคลคูลัส', 'เขียนโปรแกรม'], 
        quota: 20, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าสาขาทางวิทย์-คณิต, ศิลป์-คำนวณ หรือสายศิลปศาสตร์และคณิตศาสตร์ที่เรียนวิชาในกลุ่มวิทยาศาสตร์และเทคโนโลยีไม่น้อยกว่า 9 หน่วยกิต",
        reason : ''
      },
      { 
        name : 'สาธารณสุขศาสตร์', 
        grade : 2.25, 
        ability: ['สุขภาพ', 'ให้คำแนะนำ', 'ทำงานชุมชน', 'ป้องกันโรค', 'รักษา', 'ช่วยเหลือ'], 
        quota: 80, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'ชีววิทยา', 
        grade : null, 
        ability: ['วิทยาศาสตร์', 'ชีววิทยา', 'การทดลอง', 'วิจัย', 'สิ่งมีชีวิต', 'แล็บ'], 
        quota: 15, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      }
    ]
  },
  { name : 'คณะเทคโนโลยีอุตสาหกรรม',
    majors: [
      { 
        name : 'เทคโนโลยีอุตสาหการ', 
        grade : null, 
        ability: ['คณิตศาสตร์', 'เคมี', 'วิทยาศาสตร์', 'วางแผน', 'คำนวณ', 'งานฝีมือ', 'ช่าง', 'ฟิสิกส์', 'เลข'], 
        quota: 20, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
      },
      { 
        name : 'เทคโนโลยีอุตสาหการ (เทียบโอน)', 
        grade : 2.00, 
        ability: ['คณิตศาสตร์', 'เคมี', 'วิทยาศาสตร์', 'วางแผน', 'คำนวณ', 'งานฝีมือ', 'ช่าง', 'ฟิสิกส์', 'เลข'], 
        quota: 50, 
        condition: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาวิชาทางด้านช่างอุตสาหกรรม, ช่างยนต์, ช่างกล, ช่างเชื่อม หรือสาขาวิชาที่เกี่ยวข้อง",
       reason : ''
      },
      { 
        name : 'เทคโนโลยีคอมพิวเตอร์การออกแบบ', 
        grade : null, 
        ability: ['คณิตศาสตร์', 'ออกแบบ', 'คอมพิวเตอร์', 'กราฟิก', 'ดิจิทัล', 'ฟิสิกส์', 'เลข'], 
        quota: 15, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'เทคโนโลยีคอมพิวเตอร์การออกแบบ (เทียบโอน)', 
        grade : 2.00, 
        ability: ['คณิตศาสตร์', 'ออกแบบ', 'คอมพิวเตอร์', 'กราฟิก', 'ดิจิทัล', 'ฟิสิกส์', 'เลข'], 
        quota: 15, 
        condition: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาวิชาทางด้านการออกแบบ, คอมพิวเตอร์กราฟิก, ดิจิทัลกราฟิก หรือสาขาวิชาที่เกี่ยวข้อง",
        reason : ''
      },
      { 
        name : 'เทคโนโลยีไฟฟ้า', 
        grade : null, 
        ability: ['ต่อวงจร', 'คณิตศาสตร์', 'การออกแบบ', 'ใช้เครื่องมือวัดทางไฟฟ้า', 'ฟิสิกส์', 'plc', 'เลข', 'ไฟฟ้า'], 
        quota: 20, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'เทคโนโลยีไฟฟ้า (เทียบโอน)', 
        grade : 2.00, 
        ability: ['ต่อวงจร', 'คณิตศาสตร์', 'การออกแบบ', 'ใช้เครื่องมือวัดทางไฟฟ้า', 'ฟิสิกส์', 'plc', 'เลข', 'ไฟฟ้า'], 
        quota: 40, 
        condition: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาวิชาทางด้านไฟฟ้า หรือสาขาวิชาที่เกี่ยวข้อง",
        reason : ''
      },
      { 
        name : 'เทคโนโลยีสำรวจและภูมิสารสนเทศ', 
        grade : null, 
        ability: ['สำรวจ', 'ภูมิประเทศ', 'ใช้เครื่องมือสำรวจ', 'อ่านและสร้างแผนที่', 'ใช้ระบบจีพีเอส', 'คำนวณพิกัดและระยะทาง', 'เทคโนโลยี', 'ฟิสิกส์', 'เลข'], 
        quota: 20, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'เทคโนโลยีสำรวจและภูมิสารสนเทศ (เทียบโอน)', 
        grade : 2.00, 
        ability: ['สำรวจ', 'ภูมิประเทศ', 'ใช้เครื่องมือสำรวจ', 'อ่านและสร้างแผนที่', 'ใช้ระบบจีพีเอส', 'คำนวณพิกัดและระยะทาง', 'เทคโนโลยี', 'ฟิสิกส์', 'เลข'], 
        quota: 10, 
        condition: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาวิชาทางด้านช่างสำรวจ หรือสาขาวิชาที่เกี่ยวข้อง",
        reason : ''
      },
      { 
        name : 'วิศวกรรมคอมพิวเตอร์', 
        grade : null, 
        ability: ['คณิตศาสตร์', 'คอมพิวเตอร์', 'เขียนโปรแกรม', 'ออกแบบ', 'โค้ด', 'ซ่อมคอม', 'ฟิสิกส์', 'เลข'], 
        quota: 30, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าสาขาทางด้านคอมพิวเตอร์ หรือสาขาวิชาที่เกี่ยวข้อง",
        reason : ''
      },
      { 
        name : 'วิศวกรรมคอมพิวเตอร์ (เทียบโอน)', 
        grade : 2.00, 
        ability: ['คณิตศาสตร์', 'คอมพิวเตอร์', 'เขียนโปรแกรม', 'ออกแบบ', 'โค้ด', 'ซ่อมคอม', 'ฟิสิกส์', 'เลข'], 
        quota: 30, 
        condition: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาวิชาทางด้านคอมพิวเตอร์ หรือสาขาวิชาที่เกี่ยวข้อง",
        reason : ''
      },
      { 
        name : 'วิศวกรรมบริหารงานก่อสร้าง', 
        grade : null, 
        ability: ['คณิตศาสตร์', 'การบริหาร', 'ช่าง', 'ก่อสร้าง', 'เคมี', 'ฟิสิกส์', 'เลข'], 
        quota: 20, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'วิศวกรรมบริหารงานก่อสร้าง (เทียบโอน)', 
        grade : 2.00, 
        ability: ['คณิตศาสตร์', 'การบริหาร', 'ช่าง', 'ก่อสร้าง', 'เคมี', 'ฟิสิกส์', 'เลข'], 
        quota: 20, 
        condition: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาทางด้านก่อสร้าง หรือสาขาวิชาที่เกี่ยวข้อง",
        reason : ''
      },
      { 
        name : 'วิศวกรรมการจัดการพลังงานในงานอุตสาหกรรม', 
        grade : null, 
        ability: ['คณิตศาสตร์', 'การจัดการ', 'การบริหาร', 'เคมี', 'ฟิสิกส์', 'เลข', 'ไฟฟ้า', 'เครื่องกล', 'ช่างเชื่อม', 'ยานยนต์'], 
        quota: 20, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าสาขาวิทย์-คณิต, ศิลป์-คำนวณ หรือสาขาที่เกี่ยวข้อง",
        reason : ''
      },
      { 
        name : 'วิศวกรรมการจัดการพลังงานในงานอุตสาหกรรม (เทียบโอน)', 
        grade : 2.00, 
        ability: ['คณิตศาสตร์', 'การจัดการ', 'การบริหาร', 'เคมี', 'ฟิสิกส์', 'เลข', 'ไฟฟ้า', 'เครื่องกล', 'ช่างเชื่อม', 'ยานยนต์'],
        quota: 20, 
        condition: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาวิชาไฟฟ้า, เครื่องกล, ยานยนต์, ช่างเชื่อม, ช่างก่อสร้าง หรือสาขาวิชาที่เกี่ยวข้อง",
        reason : ''
      },
      { 
        name : 'วิศวกรรมโลจิสติกส์', 
        grade : null, 
        ability: ['คณิตศาสตร์', 'การขนส่ง', 'ผลิต', 'ออกแบบ', 'ฟิสิกส์', 'เลข', 'ไฟฟ้า', 'การจัดการ', 'บริหารคลังสินค้า'], 
        quota: 30, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าสาขาวิทย์-คณิต, ศิลป์-คำนวณ หรือสาขาที่เกี่ยวข้อง",
        reason : ''
      }
    ] 
  },
  { name : 'คณะเทคโนโลยีอุตสาหกรรม',
    majors: [
      { 
        name : 'เทคโนโลยีการอาหาร', 
        grade : null, 
        ability: ['การแปรรูปอหาร', 'เคมี', 'ชีววิทยา', 'โภชนาการ', 'ควบคุมคุณภาพอาหาร', 'บรรจุภัณฑ์อาหาร', 'การตลาด', 'คิดค้นสูตรอาหาร'], 
        quota: 30, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
      { 
        name : 'เทคโนโลยีการอาหาร (เทียบโอน)', 
        grade : 2.00, 
        ability: ['การแปรรูปอหาร', 'เคมี', 'ชีววิทยา', 'โภชนาการ', 'ควบคุมคุณภาพอาหาร', 'บรรจุภัณฑ์อาหาร', 'การตลาด', 'คิดค้นสูตรอาหาร'], 
        quota: 30, 
        condition: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาอาหารและโภชนาการ, เทคโนโลยีการอาหารคหกรรม, อุตสาหกรรมเกษตร หรือสาขาวิชาที่เกี่ยวข้อง",
        reason : ''
      },
      { 
        name : 'เกษตรศาสตร์', 
        grade : null, 
        ability: ['เกษตร', 'การตลาด', 'จัดการฟาร์ม', 'วิทยาศาสตร์', 'เทคโนโลยี', 'เลี้ยงสัตว์', 'เพาะปลูกพืช', 'ใช้เครื่องมือเกษตร', 'การบริหาร', 'การจัดการ'], 
        quota: 30, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
      },
    ] 
  },
  { name : 'คณะพยาบาลศาสตร์',
    majors: [
      { 
        name : 'พยาบาลศาสตร์', 
        grade : 2.50, 
        ability: ['ดูแลผู้ป่วย', 'การแพทย์', 'สังเกตอาการ', 'ให้คำแนะนำ', 'การสื่อสาร', 'ปฐมพยาบาล', 'การบริหาร', 'การจัดการ', 'การพยาบาล', 'ชีววิทยา', 'สรีรวิทยา', 'สุขศึกษา', 'จิตวิทยา'], 
        quota: 48, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าสาขาวิทย์-คณิต (ค่าคะแนนเฉลี่ยอย่างน้อย 5 ภาคการศึกษา)",
        reason : ''
      }
    ]
  },
  { name : 'วิทยาลัยน่าน',
    majors: [
      { 
        name : 'การจัดการ', 
        grade : null, 
        ability: ['บริหารธุรกิจ', 'การตลาด', 'การจัดการ', 'การวางแผน', 'การเป็นผู้ประกอบการ', 'การขาย', 'การบริหาร', 'การจัดการ', 'การสื่อสาร', 'ตัดสินใจและแก้ปัญหา'], 
        quota: 40, 
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : ''
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
      fulfillmentText: `ขอบคุณค่ะ คุณได้เกรด ${grade} กรุณาระบุความสามารถหรือความถนัดของคุณ (เช่น เลข วิทยาศาสตร์ คอมพิวเตอร์)`
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
    careers: majorInfo.careers || [],  // เก็บอาชีพด้วย
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

     // ดึง session จาก MongoDB
    const session = await Session.findOne({ sessionId });

    // ตรวจว่าเป็นการคลิกจาก Rich Menu หรือไม่
    if (userMessage === 'แนะนำคณะ') {
    // ส่ง "สวัสดี" เข้า Dialogflow เพื่อให้มันเริ่ม intent welcome เหมือนเดิม
    const dialogflowResult = await detectIntentText(sessionId, 'สวัสดี');

    await lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: dialogflowResult.fulfillmentText
    });
    
 // ส่งอาชีพหลัง delay ถ้ามี recommendations ใน session
 if (session?.recommendations?.length > 0) {
  setTimeout(async () => {
    for (const rec of session.recommendations) {
      if (rec.careers.length > 0) {
        await lineClient.pushMessage(event.source.userId, {
          type: 'text',
          text: `💼 อาชีพที่เกี่ยวข้องกับ ${rec.major}:\n• ${rec.careers.join('\n• ')}`
        });
        await new Promise(r => setTimeout(r, 500)); // delay ระหว่างข้อความ
      }
    }
  }, 2000);
  }
  return; // ออกก่อน ไม่ให้ตอบซ้ำ
  }
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
