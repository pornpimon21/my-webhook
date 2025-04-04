const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post("/webhook", (req, res) => {
    console.log("Received request body:", req.body);

    const { grade, ability } = req.body;

    if (grade === undefined || !Array.isArray(ability)) {
        return res.status(400).json({ error: "Invalid input data" });
    }

    function findMatchingMajors(grade, ability) {
        return faculties.flatMap(faculty => 
            faculty.majors.filter(major => 
                (major.grade === null || grade >= major.grade) &&
                major.ability.some(a => ability.includes(a))
            ).map(major => `${faculty.name} - ${major.name}`)
        );
    }

    const faculties = [
        {
            name: 'คณะครุศาสตร์',
            majors: [
                { name: 'ภาษาไทย', grade: 2.75, ability: ['ภาษาไทย', 'สอน'], seats: 60 },
                { name: 'วิทยาศาสตร์ทั่วไป', grade: 2.50, ability: ['วิทยาศาสตร์', 'เคมี'], seats: 60 }
            ]
        },
        {
            name: 'คณะมนุษยศาสตร์และสังคมศาสตร์',
            majors: [
                { name: 'รัฐประศาสนศาสตร์', grade: null, ability: ['สังคม', 'การเมือง'], seats: 50 }
            ]
        }
    ];

    console.log("Searching for matches...");
    const matchingMajors = findMatchingMajors(grade, ability);
    console.log("Matching Majors:", matchingMajors);

    res.json({ matchingMajors });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
