const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post("/webhook", (req, res) => {
    console.log("📥 ข้อมูลที่ได้รับจาก Dialogflow:", JSON.stringify(req.body, null, 2));
    const intent = req.body.queryResult.intent.displayName;
    let responseText = "ไม่เข้าใจคำถาม";

    // ข้อมูลจาก Dialogflow
    const grade = parseFloat(req.body.queryResult.parameters.grade) || 0;
    const subjectGrades = req.body.queryResult.parameters.subjectGrades || {};
    const ability = req.body.queryResult.parameters.ability || "";
    const education = req.body.queryResult.parameters.education || "";

    // ข้อมูลคณะและสาขาตามรูปภาพ
    const faculties = [
            {
                name: 'คณะครุศาสตร์',
                majors: [
                    { name: 'ภาษาไทย', minGrade: 2.75, subject: { 'ภาษาไทย': 3.0 }, ability: ['ภาษาไทย', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
                    { name: 'วิทยาศาสตร์ทั่วไป', minGrade: 2.50, ability: ['วิทยาศาสตร์', 'เคมี', 'ฟิสิกส์', 'ชีววิทยา', 'แล็บ'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าสาขาทางวิทย์-คณิต, หรือสาขาที่เกี่ยวข้องกับวิทยาศาสตร์"},
                    { name: 'การประถมศึกษา', minGrade: 2.75, ability: ['สอนเด็กประถม', 'บริหารห้องเรียน', 'ออกแบบการเรียนการสอน', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
                    { name: 'ภาษาต่างประเทศ วิชาเอกภาษาอังกฤษ', minGrade: 2.75, ability: ['การสื่อสาร', 'ภาษาอังกฤษ', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
                    { name: 'ภาษาต่างประเทศ วิชาเอกภาษาจีน', minGrade: 2.50, ability: ['การสื่อสาร', 'ภาษาจีน', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
                    { name: 'ภาษาต่างประเทศ วิชาเอกภาษาเกาหลี', minGrade: 2.50, ability: ['การสื่อสาร', 'ภาษาเกาหลี', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 30, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
                    { name: 'การศึกษาปฐมวัย', minGrade: 2.75, ability: ['รักเด็ก', 'อดทน', 'จัดกิจกรรมเด็ก', 'สอน', 'ครุู', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
                    { name: 'คณิตศาสตร์', minGrade: 3.00, subject: { 'คณิตศาสตร์': 2.75 }, ability: ['เลข', 'คำนวณ', 'คณิต', 'สถิติ', 'แคลคูลัส', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าสาขาทางวิทย์-คณิต, ศิลป์-คำนวณหรือสาขาที่มีคณิตศาสตร์เพิ่มเติม"},
                    { name: 'สังคมศึกษา', minGrade: 2.75, ability: ['สังคม', 'สอนประวัติศาสตร์', 'พูด', 'การเมือง', 'มารยาท', 'เข้าสังคม', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
                    { name: 'พลศึกษา', minGrade: 2.75, ability: ['กีฬา', 'ออกกำลังกาย', 'พูด', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
                    { name: 'เกษตรศาสตร์', minGrade: 2.30, ability: ['สิ่งแวดล้อม', 'การอนุรักษ์', 'ต้นไม้', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
                    { name: 'นาฏศิลป์', minGrade: 2.30, ability: ['ดนตรี', 'การแสดง', 'เต้น', 'รำ', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
                    { name: 'คอมพิวเตอร์และเทคโนโลยีดิจิทัลเพื่อการศึกษา วิชาเอกคอมพิวเตอร์', minGrade: 2.50, ability: ['เทคโนโลยี', 'คอมพิวเตอร์', 'ดิจิทัล', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"},
                    { name: 'คอมพิวเตอร์และเทคโนโลยีดิจิทัลเพื่อการศึกษา วิชาเอกคอมพิวเตอร์และเทคโนโลยีดิจิทัลเพื่อศึกษา', minGrade: 2.50, ability: ['เทคโนโลยี', 'คอมพิวเตอร์', 'ดิจิทัล', 'สอน', 'ครุู', 'รักเด็ก', 'เข้าใจในการสอน'], seats: 60, qualification: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน"}
                ]
            },
            // คณะอื่นๆ ก็เปลี่ยน grade เป็น minGrade เช่นเดียวกัน
            // ...
        ];
        
        // ส่วนอื่นๆ ของโค้ดไม่มีการเปลี่ยนแปลงใดๆ

    // หาคณะที่ตรงกับเงื่อนไข
    let matchedFaculties = faculties.filter(faculty => {
        return grade >= faculty.minGrade;
    });

    // สร้าง response ตามรูปแบบในรูปภาพ
    if (matchedFaculties.length > 0) {
        responseText = "# ระบบการลงทุน (3.25) และการระยะเวลาการลงทุน, เวลาเวนคาย - แบบรายงานคน\n\n";
        
        matchedFaculties.forEach(faculty => {
            responseText += `- กีฬา: ${faculty.id}\n`;
            responseText += `ตอบ: ${faculty.name}\n`;
            responseText += `สาขา: ${faculty.major}\n`;
            responseText += `เกษตรศึกษา: ${faculty.minGrade.toFixed(2)}\n`;
            responseText += `จำนวนวัน: ${faculty.seats} คน\n\n`;
            responseText += `คุณสมบัติ: ${faculty.qualification}\n\n`;
        });
    } else {
        responseText = "ขออภัย ไม่พบคณะที่ตรงกับเกรดของคุณ";
    }

    // ส่วนของ intents เดิมที่ไม่ต้องแก้ไข
    if (intent === "welcome") {
        responseText = "สวัสดีค่ะ ยินดีต้อนรับสู่แชทบอทแนะนำคณะและสาขา กรุณาแจ้งชื่อของคุณค่ะ";
    } else if (intent === "get name") {
        responseText = `สวัสดีคุณ ${req.body.queryResult.parameters.name} กรุณาระบุเกรดเฉลี่ยของคุณ (เช่น 3.5)`;
    } else if (intent === "get grade") {
        responseText = `ขอบคุณค่ะ คุณได้เกรด ${req.body.queryResult.parameters.grade} กรุณาระบุความสามารถหรือความถนัดของคุณ (เช่น เลข, วิทยาศาสตร์, คอมพิวเตอร์) คั่นด้วยเครื่องหมายคอมม่า`;
    } else if (intent === "get skills") {
        // ใช้ responseText ที่สร้างจาก matchedFaculties อยู่แล้ว
    }

    res.status(200).json({
        fulfillmentText: responseText
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});