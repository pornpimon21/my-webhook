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
            id: 1,
            name: "คณะวิทยาศาสตร์และเทคโนโลยี",
            major: "วิทยาการคอมพิวเตอร์",
            minGrade: 2.00,
            seats: 30,
            qualification: "สังคมศึกษาตอนปลายบริหารไทยเช่าทุกแผนการเงิน"
        },
        {
            id: 2,
            name: "คณะเทคโนโลยีอุตสาหกรรม",
            major: "วิเคราะห์ของครัวเรย์",
            minGrade: 2.00,
            seats: 30,
            qualification: "สังคมศึกษาตอนปลายบริหารไทยเช่าทุกแผนการเงิน"
        },
        {
            id: 3,
            name: "คณะอุตสาหกรรม",
            major: "คณะการจัดการในโครงสร้างการศึกษา วิชาและคอมพิวเตอร์",
            minGrade: 2.00,
            seats: 30,
            qualification: "สังคมศึกษาตอนปลายบริหารไทยเช่าทุกแผนการเงิน"
        },
        {
            id: 4,
            name: "คณะวิทยาการจัดการ",
            major: "คณะอิเล็กทรอนิกส์",
            minGrade: 2.00,
            seats: 30,
            qualification: "สังคมศึกษาตอนปลายบริหารไทยเช่าทุกแผนการเงิน"
        },
        {
            id: 5,
            name: "คณะวิทยาศาสตร์และเทคโนโลยี",
            major: "เครื่องมืออาชีพบุคคล",
            minGrade: 2.00,
            seats: 30,
            qualification: "สังคมศึกษาตอนปลายบริหารไทยเช่าทุกแผนการเงิน"
        }
    ];

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