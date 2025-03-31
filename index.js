const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post("/webhook", (req, res) => {
    const intent = req.body.queryResult.intent.displayName;
    let responseText = "ไม่เข้าใจคำถาม";

    // ตัวอย่างข้อมูลเกรดและช่วงเกรด
    const grade = { min: 3.5, max: 4.0 };
    
    // ตัวอย่างข้อมูลทักษะ (abilities)
    const abilities = ['เลข', 'วิทยาศาสตร์', 'ชอบทดลอง'];

    // ข้อมูลคณะและสาขา (faculties and majors)
    const faculties = [
        { name: 'คณะแพทยศาสตร์', grade: 4.0, majors: ['แพทยศาสตร์', 'วิทยาศาสตร์การแพทย์'] },
        { name: 'คณะวิศวกรรมศาสตร์', grade: 3.8, majors: ['วิศวกรรมไฟฟ้า', 'วิศวกรรมคอมพิวเตอร์', 'วิศวกรรมเคมี'] },
        { name: 'คณะวิทยาศาสตร์', grade: 3.7, majors: ['ฟิสิกส์', 'เคมี', 'ชีววิทยา'] }
    ];

    // ตรวจสอบ intent และตอบกลับตาม intent ที่ได้รับ
    if (intent === "get skill") {
        // สร้างข้อความตอบกลับ
        responseText =` ช่วงเกรดที่กำหนด: min: ${grade.min}, max: ${grade.max}\n`;
    
        // แสดงข้อมูลทักษะ
        responseText += `ทักษะที่สามารถพัฒนาได้ ได้แก่:\n`;
        abilities.forEach((ability, index) => {
            responseText += `${index + 1}. ${ability}\n`;
        });

        // เรียงลำดับคณะตามเกรดจากมากไปน้อย
        faculties.sort((a, b) => b.grade - a.grade); // เรียงตามเกรดจากมากไปหาน้อย

        // แสดงข้อมูลคณะและสาขา
        responseText += `คณะและสาขาที่เกี่ยวข้อง (เรียงตามเกรด):\n`;
        faculties.forEach((faculty, index) => {
            responseText += `${index + 1}. ${faculty.name} (เกรด: ${faculty.grade}):\n`;
            faculty.majors.forEach((major) => {
                responseText +=   ` - ${major}\n`;
            });
        });
    } else if (intent === "welcome") {
        responseText = "สวัสดีค่ะ ยินดีต้อนรับสู่แชทบอทแนะนำคณะและสาขา กรุณาแจ้งชื่อของคุณค่ะ";
    } else if (intent === "get name") {
        const name = req.body.queryResult.parameters.name || "คุณ";
        responseText = `สวัสดีคุณ ${name} กรุณาระบุเกรดเฉลี่ยของคุณ (เช่น 3.5)`;
    } else if (intent === "get grade") {
        const grade = req.body.queryResult.parameters.grade || "ไม่ระบุ";
        responseText = `ขอบคุณค่ะ คุณได้เกรด ${grade} กรุณาระบุความสามารถหรือความถนัดของคุณ (เช่น เลข, วิทยาศาสตร์, คอมพิวเตอร์) คั่นด้วยเครื่องหมายคอมม่า`;
    }

    // ส่งคำตอบกลับไปยัง Dialogflow
    res.json({ fulfillmentText: responseText });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});