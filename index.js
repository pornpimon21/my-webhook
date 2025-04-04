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
            name: 'คณะวิทยาศาสตร์และเทคโนโลยี',
            majors: [
                { name: 'วิทยาการคอมพิวเตอร์', minGrade: 2.00, seats: 30, qualification: "สังคมศึกษาตอนปลายบริหารไทยเช่าทุกแผนการเงิน" }
            ]
        },
        {
            name: 'คณะเทคโนโลยีอุตสาหกรรม',
            majors: [
                { name: 'วิเคราะห์ของครัวเรย์', minGrade: 2.00, seats: 30, qualification: "สังคมศึกษาตอนปลายบริหารไทยเช่าทุกแผนการเงิน" }
            ]
        },
        {
            name: 'คณะอุตสาหกรรม',
            majors: [
                { name: 'คณะการจัดการในโครงสร้างการศึกษา วิชาและคอมพิวเตอร์', minGrade: 2.00, seats: 30, qualification: "สังคมศึกษาตอนปลายบริหารไทยเช่าทุกแผนการเงิน" }
            ]
        },
        {
            name: 'คณะวิทยาการจัดการ',
            majors: [
                { name: 'คณะอิเล็กทรอนิกส์', minGrade: 2.00, seats: 30, qualification: "สังคมศึกษาตอนปลายบริหารไทยเช่าทุกแผนการเงิน" }
            ]
        },
        {
            name: 'คณะวิทยาศาสตร์และเทคโนโลยี',
            majors: [
                { name: 'เครื่องมืออาชีพบุคคล', minGrade: 2.00, seats: 30, qualification: "สังคมศึกษาตอนปลายบริหารไทยเช่าทุกแผนการเงิน" }
            ]
        }
    ];

    // ค้นหาสาขาที่ตรงกับเงื่อนไข
    let matchedFaculties = faculties.filter(faculty => {
        return faculty.majors.some(major => {
            // ตรวจสอบเกรดขั้นต่ำของสาขา
            if (major.minGrade !== null && grade < major.minGrade) return false;
            
            // ตรวจสอบทักษะ (ถ้ามี)
            if (ability.length > 0 && major.ability && !major.ability.some(skill => ability.includes(skill))) return false;
            
            return true;
        });
    });

    // ถ้าไม่มีสาขาที่ตรง
    if (matchedFaculties.length === 0) {
        return res.status(200).json({
            fulfillmentText: "ขออภัย ไม่มีคณะหรือสาขาที่ตรงกับเกรดและคุณสมบัติของคุณ"
        });
    }

    // สร้างข้อความตอบกลับตามรูปแบบที่ต้องการ
    responseText = "ระบบการลงทุน (3.25) และการระยะเวลาการลงทุน, เวลาเวนคาย - แบบรายงานคน\n\n";

    matchedFaculties.forEach((faculty, index) => {
        faculty.majors.forEach(major => {
            responseText += `- กีฬา: ${index + 1}\n`;
            responseText += `ตอบ: ${faculty.name}\n`;
            responseText += `สาขา: ${major.name}\n`;
            responseText += `เกษตรศึกษา: ${major.minGrade.toFixed(2)}\n`;
            responseText += `จำนวนวัน: ${major.seats} คน\n\n`;
            responseText += `คุณสมบัติ: ${major.qualification}\n\n`;
        });
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
        fulfillmentText: responseText
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});