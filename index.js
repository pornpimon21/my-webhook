const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ข้อมูลคณะและสาขาวิชา
const faculties = [
    {
        name: "คณะครุศาสตร์",
        majors: [
            { name: "ภาษาไทย", grade: 2.75, ability: ["ภาษาไทย", "สอน", "ครุู"], seats: 60 },
            { name: "คณิตศาสตร์", grade: 3.00, ability: ["เลข", "คำนวณ", "สอน"], seats: 60 }
        ]
    },
    {
        name: "คณะวิทยาการจัดการ",
        majors: [
            { name: "บัญชี", grade: null, ability: ["คำนวณ", "ทำบัญชี"], seats: 40 },
            { name: "นิเทศศาสตร์", grade: null, ability: ["การแสดง", "สื่อสาร"], seats: 30 }
        ]
    }
];

// ฟังก์ชันค้นหาสาขาวิชาที่ตรงกับเกรดและความสามารถ
function findMatchingMajors(grade, ability) {
    return faculties.flatMap(faculty => 
        faculty.majors
            .filter(major => 
                (major.grade === null || grade >= major.grade) &&
                major.ability.some(a => ability.includes(a))
            )
            .map(major => `${faculty.name} - ${major.name}`)
    );
}

// Webhook API
app.post("/webhook", (req, res) => {
    const { grade, ability } = req.body;

    if (grade === undefined || !Array.isArray(ability)) {
        return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน (ต้องมี grade และ ability เป็น array)" });
    }

    const matchingMajors = findMatchingMajors(grade, ability);

    res.json({ matchingMajors });
});

// เริ่มต้นเซิร์ฟเวอร์
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
