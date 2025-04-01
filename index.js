const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post("/webhook", (req, res) => {
    console.log("📥 ข้อมูลที่ได้รับจาก Dialogflow:", JSON.stringify(req.body, null, 2));
    const intent = req.body.queryResult.intent.displayName;
    let responseText = "ไม่เข้าใจคำถาม";


    const grade = parseFloat(req.body.queryResult.parameters.grade) || 0;
    const subjectGrades = req.body.queryResult.parameters.subjectGrades || {}; // เกรดเฉพาะวิชา
    const ability = req.body.queryResult.parameters.ability || "";
    const education = req.body.queryResult.parameters.education || "ไม่มีข้อมูล"; 

    console.log("➡️ เกรดรวม:", grade);
    console.log("➡️ เกรดรายวิชา:", subjectGrades);
    console.log("➡️ ทักษะ:", ability);
    console.log("➡️ ระดับการศึกษา:", education);



    const faculties = [
        {
        name : 'คณะครุศาสตร์',
        majors: [
        { name : 'ภาษาไทย', grade : 2.75, subject : { 'ภาษาไทย': 3.0 }, ability: ['ภาษาไทย', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'วิทยาศาสตร์ทั่วไป', grade : 2.50, ability : ['วิทยาศาสตร์', 'เคมี', 'ฟิสิกส์', 'ชีววิทยา', 'แล็บ'], seats: 60, seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าสาขาทางวิทย์-คณิต, หรือสาขาที่เกี่ยวข้องกับวิทยาศาสตร์"},
        { name : 'การประถมศึกษา', grade :  2.75, ability : ['สอนเด็กประถม', 'บริหารห้องเรียน', 'ออกแบบการเรียนการสอน', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'ภาษาต่างประเทศ วิชาเอกภาษาอังกฤษ', grade : 2.75, ability : ['การสื่อสาร', 'ภาษาอังกฤษ', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'ภาษาต่างประเทศ วิชาเอกภาษาจีน', grade : 2.50, ability : ['การสื่อสาร', 'ภาษาจีน', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'ภาษาต่างประเทศ วิชาเอกภาษาเกาหลี', grade : 2.50, ability : ['การสื่อสาร', 'ภาษาเกาหลี', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 30, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'การศึกษาปฐมวัย', grade : 2.75, ability : ['รักเด็ก', 'อดทน', 'จัดกิจกรรมเด็ก', 'สอน', 'ครุู', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'คณิตศาสตร์', grade : 3.00, subject : { 'คณิตศาสตร์': 2.75 }, ability: ['เลข', 'คำนวณ', 'คณิต', 'สถิติ', 'แคลคูลัส', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าสาขาทางวิทย์-คณิต, ศิลป์-คำนวณหรือสาขาที่มีคณิตศาสตร์เพิ่มเติม"},
        { name : 'สังคมศึกษา', grade : 2.75, ability: ['สังคม', 'สอนประวัติศาสตร์', 'พูด', 'การเมือง', 'มารยาท', 'เข้าสังคม', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'พลศึกษา', grade : 2.75, ability: ['กีฬา', 'ออกกำลังกาย', 'พูด', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'เกษตรศา่สตร์', grade : 2.30, ability: ['สิ่งแวดล้อม', 'การอนุรักษ์', 'ต้นไม้', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'นาฏศิลป์', grade : 2.30, ability: ['ดนตรี', 'การแสดง', 'เต้น', 'รำ', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'คอมพิวเตอร์และเทคโนโลยีดิจิทัลเพื่อการศึกษา วิชาเอกคอมพิวเตอร์', grade : 2.50, ability: ['เทคโนโลยี', 'คอมพิวเตอร์', 'ดิจิทัล', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'คอมพิวเตอร์และเทคโนโลยีดิจิทัลเพื่อการศึกษา วิชาเอกคอมพิวเตอร์และเทคโนโลยีดิจจิทัลเพื่อศึกษา', grade : 2.50, ability: ['เทคโนโลยี', 'คอมพิวเตอร์', 'ดิจิทัล', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"}
        ]
        },
        {
        name : 'คณะมนุษยศาสตร์และสังคมศาสตร์',
        majors: [
        { name : 'การพัฒนาชุมชน', grade : null, ability: ['ช่วยเหลือสังคม', 'ทำงานชุมชน', 'ชุมชน', 'พัฒนา'], seats: 20, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'รัฐประศาสนศาสตร์', grade : null, ability: ['สังคม', 'การเมือง', 'การปกครอง'], seats: 50, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'ทัศนศิลป์', grade : null, ability: ['วาดรูป', 'วาดภาพ', 'สี', 'การออกแบบ', 'ความคิดสร้างสรรค์', 'ศิลป์'], seats: 25, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'ภาษาอังกฤษ วิชาเอกภาษาอังกฤษ', grade : null, ability: ['การสื่อสาร', 'ภาษาอังกฤษ', 'วัฒนธรรมต่างประเทศ'], seats: 25, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'ภาษาอังกฤษ วิชาเอกภาษาอังกฤษเพื่อการสื่อสารและการแปล', grade : null, ability: ['การสื่อสาร', 'ภาษาอังกฤษ', 'แปลภาษา'], seats: 25, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'ภาษาอังกฤษธุรกิจ (หลักสูตรนานาชาติ)', grade : null, ability: ['อินเตอร์', 'ธุรกิจ', 'การสื่อสาร', 'ภาษาอังกฤษ'], seats: 20, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"}
        ]
        },
        {
        name : 'คณะวิทยาการจัดการ',
        majors: [
        { name : 'เศรษฐกิจดิจิทัล', grade : null, ability: ['ดิจิทัล', 'ธุรกิจ', 'เศรษฐกิจ', 'การจัดการ'], seats: 20, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'เศรษฐกิจดิจิทัล (เทียบโอน)', grade : 2.00, ability: ['ดิจิทัล', 'ธุรกิจ', 'เศรษฐกิจ', 'การจัดการ'], seats: 20, qualification: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาทางด้านเทคโนโลยีธุรกิจดิจิทัล, ระบบสารสนเทศทางธุรกิจ, เทคโนโลยีสารสนเทศ, ดิจิทัลกราฟิก, หรือสาขาวิชาอื่นๆที่เกี่ยวข้อง"},
        { name : 'บัญชี', grade : null, ability: ['คำนวณ', 'ทำบัญชี', 'เลข', 'การจัดการ'], seats: 40, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'บัญชี (เทียบโอน)', grade : 2.00, ability: ['คำนวณ', 'ทำบัญชี', 'เลข', 'การจัดการ'], seats: 105, qualification: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาทางบัญชี"},
        { name : 'คอมพิวเตอร์ธุรกิจ', grade : null, ability: ['การจัดการ', 'ธุรกิจ', 'คอมพิวเตอร์'], seats: 30, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'คอมพิวเตอร์ธุรกิจ (เทียบโอน)', grade : 2.00, ability: ['การจัดการ', 'ธุรกิจ', 'คอมพิวเตอร์'], seats: 30, qualification: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาทางด้านเทคโนโลยีธุรกิจดิจิทัล, ระบบสารสนเทศทางธุรกิจ, เทคโนโลยีสารสนเทศ, ดิจิทัลกราฟิก, หรือสาขาวิชาอื่นๆที่เกี่ยวข้อง"},
        { name : 'นิเทศศาสตร์', grade : null, ability: ['การจัดการ', 'การแสดง', 'หน้าตา', 'สื่อสาร', 'การตลาด', 'ออกแบบ'], seats: 30, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"}
        ]
        },
        {
        name : 'คณะวิทยาศาสตร์และเทคโนโลยี',
        majors: [
        { name : 'เทคโนโลยีสารสนเทศ', grade : null, ability: ['ไอที', 'IT', 'โปรแกรม', 'เขียนโปรแกรม', 'ออกแบบแอปพลิเคชัน', 'data', 'ข้อมูล', 'ฐานข้อมูล', 'คอมพิวเตอร์'], seats: 30, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'เทคโนโลยีสารสนเทศ (เทียบโอน)', grade : 2.00, ability: ['ไอที', 'IT', 'โปรแกรม', 'เขียนโปรแกรม', 'ออกแบบแอปพลิเคชัน', 'data', 'ข้อมูล', 'ฐานข้อมูล', 'คอมพิวเตอร์'], seats: 30, qualification: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาทางด้านคอมพิวเตอร์ หรือสาขาที่เกี่ยวข้อง"},
        { name : 'วิทยาการคอมพิวเตอร์', grade : null, ability: ['โค้ด', 'code', 'โปรแกรม', 'เขียนโปรแกรม', 'ออกแบบแอปพลิเคชัน', 'data', 'ข้อมูล', 'ฐานข้อมูล', 'คอมพิวเตอร์', 'เลข', 'คณิต', 'คำนวณ', 'เขียนเว็บ'], seats: 30, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'วิทยาการคอมพิวเตอร์ (เทียบโอน)', grade : 2.00, ability: ['โค้ด', 'code', 'โปรแกรม', 'เขียนโปรแกรม', 'ออกแบบแอปพลิเคชัน', 'data', 'ข้อมูล', 'ฐานข้อมูล', 'คอมพิวเตอร์', 'เลข', 'คณิต', 'คำนวณ', 'เขียนเว็บ'], seats: 30, qualification: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาทางด้านคอมพิวเตอร์ หรือสาขาที่เกี่ยวข้อง"},
        { name : 'สิ่งแวดล้อม', grade : 2.00, ability: ['สิ่งแวดล้อม', 'ต้นไม้', 'เกษตร', 'อนุรักษ์', 'ป่าไม้'], seats: 15, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'อาหารและโภชนาการ', grade : 2.00, ability: ['การจัดการ', 'ทำอาหาร', 'อาหาร', 'โภชนาการ', 'แคลอรี', 'ปรุงอาหาร'], seats: 20, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'อาหารและโภชนาการ (เทียบโอน)', grade : 2.50, ability: ['การจัดการ', 'ทำอาหาร', 'อาหาร', 'โภชนาการ', 'แคลอรี', 'ปรุงอาหาร'], seats: 10, qualification: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาเกี่ยวข้อง"},
        { name : 'วิทยาศาสตร์กีฬาและการออกกำลังกาย', grade : null, ability: ['กีฬา', 'ออกกำลังกาย', 'วิ่ง', 'ฝึกซ้อม'], seats: 30, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'เคมี', grade : null, ability: ['วิทยาศาสตร์', 'เคมี', 'การทดลอง', 'วิจัย', 'สูตร', 'แล็บ'], seats: 30, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'คณิตศาสตร์ประยุกต์', grade : null, ability: ['เลข', 'คำนวณ', 'คณิต', 'สถิติ', 'แคลคูลัส', 'เขียนโปรแกรม'], seats: 20, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าสาขาทางวิทย์-คณิต, ศิลป์-คำนวณ หรือสายศิลปศาสตร์และคณิตศาสตร์ที่เรียนวิชาในกลุ่มวิทยาศาสตร์และเทคโนโลยีไม่น้อยกว่า 9 หน่วยกิต"},
        { name : 'สาธารณสุขศาสตร์', grade : 2.25, ability: ['สุขภาพ', 'ให้คำแนะนำ', 'ทำงานชุมชน', 'ป้องกันโรค', 'รักษา', 'ช่วยเหลือ'], seats: 80, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'ชีววิทยา', grade : null, ability: ['วิทยาศาสตร์', 'ชีววิทยา', 'การทดลอง', 'วิจัย', 'สิ่งมีชีวิต', 'แล็บ'], seats: 15, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        ]
        },
        {
        name : 'คณะเทคโนโลยีอุตสาหกรรม',
        majors: [
        { name : 'เทคโนโลยีอุตสาหการ', grade : null, ability: ['คณิตศาสตร์', 'เคมี', 'วิทยาศาสตร์', 'วางแผน', 'คำนวณ', 'งานฝีมือ', 'ช่าง', 'ฟิสิกส์', 'เลข'], seats: 20, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'เทคโนโลยีอุตสาหการ (เทียบโอน)', grade : 2.00, ability: ['คณิตศาสตร์', 'เคมี', 'วิทยาศาสตร์', 'วางแผน', 'คำนวณ', 'งานฝีมือ', 'ช่าง', 'ฟิสิกส์', 'เลข'], seats: 50, qualification: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาวิชาทางด้านช่างอุตสาหกรรม, ช่างยนต์, ช่างกล, ช่างเชื่อม หรือสาขาวิชาที่เกี่ยวข้อง"},
        { name : 'เทคโนโลยีคอมพิวเตอร์การออกแบบ', grade : null, ability: ['คณิตศาสตร์', 'ออกแบบ', 'คอมพิวเตอร์', 'กราฟิก', 'ดิจิทัล', 'ฟิสิกส์', 'เลข'], seats: 15, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'เทคโนโลยีคอมพิวเตอร์การออกแบบ (เทียบโอน)', grade : 2.00, ability: ['คณิตศาสตร์', 'ออกแบบ', 'คอมพิวเตอร์', 'กราฟิก', 'ดิจิทัล', 'ฟิสิกส์', 'เลข'], seats: 15, qualification: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาวิชาทางด้านการออกแบบ, คอมพิวเตอร์กราฟิก, ดิจิทัลกราฟิก หรือสาขาวิชาที่เกี่ยวข้อง"},
        { name : 'เทคโนโลยีไฟฟ้า', grade : null, ability: ['ต่อวงจร', 'คณิตศาสตร์', 'การออกแบบ', 'ใช้เครื่องมือวัดทางไฟฟ้า', 'ฟิสิกส์', 'plc', 'เลข', 'ไฟฟ้า'], seats: 20, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'เทคโนโลยีไฟฟ้า (เทียบโอน)', grade : 2.00, ability: ['ต่อวงจร', 'คณิตศาสตร์', 'การออกแบบ', 'ใช้เครื่องมือวัดทางไฟฟ้า', 'ฟิสิกส์', 'plc', 'เลข', 'ไฟฟ้า'], seats: 40, qualification: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาวิชาทางด้านไฟฟ้า หรือสาขาวิชาที่เกี่ยวข้อง"},
        { name : 'เทคโนโลยีสำรวจและภูมิสารสนเทศ', grade : null, ability: ['สำรวจ', 'ภูมิประเทศ', 'ใช้เครื่องมือสำรวจ', 'อ่านและสร้างแผนที่', 'ใช้ระบบจีพีเอส', 'คำนวณพิกัดและระยะทาง', 'เทคโนโลยี', 'ฟิสิกส์', 'เลข'], seats: 20, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'เทคโนโลยีสำรวจและภูมิสารสนเทศ (เทียบโอน)', grade : 2.00, ability: ['สำรวจ', 'ภูมิประเทศ', 'ใช้เครื่องมือสำรวจ', 'อ่านและสร้างแผนที่', 'ใช้ระบบจีพีเอส', 'คำนวณพิกัดและระยะทาง', 'เทคโนโลยี', 'ฟิสิกส์', 'เลข'], seats: 10, qualification: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาวิชาทางด้านช่างสำรวจ หรือสาขาวิชาที่เกี่ยวข้อง"},
        { name : 'วิศวกรรมคอมพิวเตอร์', grade : null, ability: ['คณิตศาสตร์', 'คอมพิวเตอร์', 'เขียนโปรแกรม', 'ออกแบบ', 'โค้ด', 'ซ่อมคอม', 'ฟิสิกส์', 'เลข'], seats: 30, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าสาขาทางด้านคอมพิวเตอร์ หรือสาขาวิชาที่เกี่ยวข่่อง"},
        { name : 'วิศวกรรมคอมพิวเตอร์ (เทียบโอน)', grade : 2.00, ability: ['คณิตศาสตร์', 'คอมพิวเตอร์', 'เขียนโปรแกรม', 'ออกแบบ', 'โค้ด', 'ซ่อมคอม', 'ฟิสิกส์', 'เลข'], seats: 30, qualification: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาวิชาทางด้านคอมพิวเตอร์ หรือสาขาวิชาที่เกี่ยวข้อง"},
        { name : 'วิศวกรรมบริหารงานก่อสร้าง', grade : null, ability: ['คณิตศาสตร์', 'การบริหาร', 'ช่าง', 'ก่อสร้าง', 'เคมี', 'ฟิสิกส์', 'เลข'], seats: 20, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'วิศวกรรมบริหารงานก่อสร้าง (เทียบโอน)', grade : 2.00, ability: ['คณิตศาสตร์', 'การบริหาร', 'ช่าง', 'ก่อสร้าง', 'เคมี', 'ฟิสิกส์', 'เลข'], seats: 20, qualification: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาทางด้านก่อสร้าง หรือสาขาวิชาที่เกี่ยวข้อง"},
        { name : 'วิศวกรรมการจัดการพลังงานในงานอุตสาหกรรม', grade : null, ability: ['คณิตศาสตร์', 'การจัดการ', 'การบริหาร', 'เคมี', 'ฟิสิกส์', 'เลข', 'ไฟฟ้า', 'เครื่องกล', 'ช่างเชื่อม', 'ยานยนต์'], seats: 20, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าสาขาวิทย์-คณิต, ศิลป์-คำนวณ หรือสาขาที่เกี่ยวข้อง"},
        { name : 'วิศวกรรมการจัดการพลังงานในงานอุตสาหกรรม (เทียบโอน)', grade : 2.00, ability: ['คณิตศาสตร์', 'การจัดการ', 'การบริหาร', 'เคมี', 'ฟิสิกส์', 'เลข', 'ไฟฟ้า', 'เครื่องกล', 'ช่างเชื่อม', 'ยานยนต์'], seats: 20, qualification: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาวิชาไฟฟ้า, เครื่องกล, ยานยนต์, ช่างเชื่อม, ช่างก่อสร้าง หรือสาขาวิชาที่เกี่ยวข้อง"},
        { name : 'วิศวกรรมโลจิสติกส์', grade : null, ability: ['คณิตศาสตร์', 'การขนส่ง', 'ผลิต', 'ออกแบบ', 'ฟิสิกส์', 'เลข', 'ไฟฟ้า', 'การจัดการ', 'บริหารคลังสินค้า'], seats: 30, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าสาขาวิทย์-คณิต, ศิลป์-คำนวณ หรือสาขาที่เกี่ยวข้อง"}
        ]
        },
        {
        name : 'คณะเทคโนโลยีอุตสาหกรรม',
        majors: [
        { name : 'เทคโนโลยีการอาหาร', grade : null, ability: ['การแปรรูปอหาร', 'เคมี', 'ชีววิทยา', 'โภชนาการ', 'ควบคุมคุณภาพอาหาร', 'บรรจุภัณฑ์อาหาร', 'การตลาด', 'คิดค้นสูตรอาหาร'], seats: 30, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        { name : 'เทคโนโลยีการอาหาร (เทียบโอน)', grade : 2.00, ability: ['การแปรรูปอหาร', 'เคมี', 'ชีววิทยา', 'โภชนาการ', 'ควบคุมคุณภาพอาหาร', 'บรรจุภัณฑ์อาหาร', 'การตลาด', 'คิดค้นสูตรอาหาร'], seats: 30, qualification: "อนุปริญญาหรือประกาศนียบัตรวิชาชีพขั้นสูง (ปวส) สาขาอาหารและโภชนาการ, เทคโนโลยีการอาหารคหกรรม, อุตสาหกรรมเกษตร หรือสาขาวิชาที่เกี่ยวข้อง"},
        { name : 'เกษตรศาสตร์', grade : null, ability: ['เกษตร', 'การตลาด', 'จัดการฟาร์ม', 'วิทยาศาสตร์', 'เทคโนโลยี', 'เลี้ยงสัตว์', 'เพาะปลูกพืช', 'ใช้เครื่องมือเกษตร', 'การบริหาร', 'การจัดการ'], seats: 30, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
        ]
        },
        {
        name : 'คณะพยาบาลศาสตร์',
        majors: [
        { name : 'พยาบาลศาสตร์', grade : 2.50, ability: ['ดูแลผู้ป่วย', 'การแพทย์', 'สังเกตอาการ', 'ให้คำแนะนำ', 'การสื่อสาร', 'ปฐมพยาบาล', 'การบริหาร', 'การจัดการ', 'การพยาบาล', 'ชีววิทยา', 'สรีรวิทยา', 'สุขศึกษา', 'จิตวิทยา'], seats: 48, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าสาขาวิทย์-คณิต (ค่าคะแนนเฉลี่ยอย่างน้อย 5 ภาคการศึกษา)"}
        ]
        },
        {
        name : 'วิทยาลัยน่าน',
        majors: [
        { name : 'การจัดการ', grade : null, ability: ['บริหารธุรกิจ', 'การตลาด', 'การจัดการ', 'การวางแผน', 'การเป็นผู้ประกอบการ', 'การขาย', 'การบริหาร', 'การจัดการ', 'การสื่อสาร', 'ตัดสินใจและแก้ปัญหา'], seats: 40, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"}
        ]
        },
        ];

    // ค้นหาสาขาที่ตรงกับเงื่อนไขและเรียงลำดับ
    matchedFaculties = faculties.filter(faculty => {
    return faculty.majors.some(major => {
        // ✅ ตรวจสอบเกรดขั้นต่ำของคณะ (ถ้ามี)
        if (faculty.minGrade !== null && grade < faculty.minGrade) return false;

        // ✅ ตรวจสอบเกรดเฉพาะวิชา (ถ้ามี)
        if (major.subjectRequirements) {
            for (subject in major.subjectRequirements) {
                if (!subjectGrades[subject] || subjectGrades[subject] < major.subjectRequirements[subject]) {
                    return false; // ❌ ถ้าเกรดวิชาไม่ถึงเกณฑ์
                }
            }
        }

            // ✅ ตรวจสอบทักษะ (ถ้ามี)
            if (ability.length > 0 && !faculty.skills.some(skill => ability.includes(skill))) return false;

            // ✅ ตรวจสอบระดับการศึกษา
            if (faculty.qualification && !faculty.qualification.includes(education)) return false;

            return true;
        });
    }).sort((a, b) => (b.minGrade || 0) - (a.minGrade || 0)) // เรียงจากเกรดสูงสุดลงมา
      .slice(0, 5); // เลือก 5 ลำดับแรก

    // ถ้าไม่มีสาขาที่ตรง
    if (matchedFaculties.length === 0) {
        return res.status(200).json({
            fulfillmentText: "ขออภัย ไม่มีคณะหรือสาขาที่ตรงกับเกรด ทักษะ และคุณสมบัติของคุณ"
        });
    }

    // ✅ สร้างข้อความตอบกลับ
    responseText =` จากเกรดของคุณ (${grade}) และทักษะ "${ability}" แนะนำสาขาดังนี้:\n\n`;

    matchedFaculties.forEach((faculty, index) => {
        responseText += `🎓 ${index + 1}. ${faculty.name}\n`;
        faculty.majors.forEach(major => {
            responseText +=   ` - ${major.name}`;
            if (faculty.minGrade !== null) {
                responseText += ` (เกรดไม่น้อยกว่า: ${faculty.minGrade})`;
            }
            responseText +=` , รับจำนวน: ${faculty.seats} คน\n`;

            if (major.subjectRequirements) {
                for (let subject in major.subjectRequirements) {
                    responseText +=     ` 📌 ต้องมีเกรดวิชา "${subject}" ไม่น้อยกว่า ${major.subjectRequirements[subject]}\n`;
                }
            }
            responseText +=      `📌 คุณสมบัติ: ${faculty.qualification}\n`;
        });
        responseText += "\n";
    });

    if (intent === "welcome") {
        responseText = "สวัสดีค่ะ ยินดีต้อนรับสู่แชทบอทแนะนำคณะและสาขา กรุณาแจ้งชื่อของคุณค่ะ";
    } else if (intent === "get name") {
        responseText = `สวัสดีคุณ ${req.body.queryResult.parameters.name} กรุณาระบุเกรดเฉลี่ยของคุณ (เช่น 3.5)`;
    } else if (intent === "get grade") {
        responseText = `ขอบคุณค่ะ คุณได้เกรด ${req.body.queryResult.parameters.grade} กรุณาระบุความสามารถหรือความถนัดของคุณ (เช่น เลข, วิทยาศาสตร์, คอมพิวเตอร์) คั่นด้วยเครื่องหมายคอมม่า`;
    }

    // ส่งคำตอบกลับไปยัง Dialogflow
    res.status(200).json({
        fulfillmentText: responseText});
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});