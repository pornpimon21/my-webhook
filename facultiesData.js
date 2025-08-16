// facultiesData.js

const faculties = [
  {
    name: 'คณะครุศาสตร์',
    majors: [
      {
        name: 'ภาษาไทย',
        grade: 2.75,
        ability: ['ภาษาไทย', 'สอน', 'ครู', 'รักเด็ก', 'เข้าใจในการสอน', 'การเขียน', 'สื่อสาร', 'วรรณกรรม', 'การอ่าน', 'จับใจความ', 'ไวยากรณ์', 'เรียบเรียง'],
        quota: 60,
        requiredEducation: ['มัธยมปลาย', 'ปวช', 'อื่นๆ'],
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน เกรดวิชาภาษาไทยไม่ต่ำกว่า 3.0",
        reason: 'คุณมีความสามารถด้านภาษาไทย และรักในการสื่อสารผ่านภาษา เหมาะกับการถ่ายทอดความรู้ทางภาษาให้ผู้อื่น',
        careers: ["ครูสอนภาษาไทย", "นักเขียน", "บรรณาธิการ"],
        studyPlan: 
        [
          "📘 ปี 1 : ปูพื้นฐานวิชาทั่วไป ฝึกทักษะครูเบื้องต้น และเรียนภาษาไทยพื้นฐาน",
          "📗 ปี 2 : เจาะลึกวิชาชีพครูระดับกลาง เรียนรู้การจัดการเรียนการสอน พร้อมวิชาเอกหลัก",
          "📙 ปี 3 : ก้าวสู่ระดับสูงของวิชาชีพครู ฝึกทำวิจัยและนวัตกรรม พร้อมศึกษาเชิงลึกด้านภาษาและวรรณคดี",
          "📕 ปี 4 : ลงสนามจริงกับการฝึกสอนเต็มเวลา พร้อมทำคุรุนิพนธ์ โครงงาน และเลือกวิชาเสริมความถนัด"
        ],
        studyPlanPdf: "http://academic.uru.ac.th/DB_course/doc_course/124.pdf",
        studyPlanInfoImg: "https://iili.io/FbXrVNj.png",
        website: "https://edu.uru.ac.th/",      
        majorsFacebook: "https://www.facebook.com/profile.php?id=100063988815394#",
        facultyFacebook: "https://www.facebook.com/educationuruacth",
        logoUrl: "https://kharusartsuksa.uru.ac.th/images/uru_logo.png"
      },
      {
        name: 'วิทยาศาสตร์ทั่วไป',
        grade: 2.50,
        ability: ['วิทยาศาสตร์', 'เคมี', 'ฟิสิกส์', 'ชีววิทยา', 'แล็บ'],
        quota: 60,
        requiredEducation: ['มัธยมปลาย', 'ปวช'],
        condition: "มัธยมศึกษาตอนปลายหรือเทียบเท่าสาขาทางวิทย์-คณิต, หรือสาขาที่เกี่ยวข้องกับวิทยาศาสตร์",
        reason: 'คุณมีความสามารถด้านวิทยาศาสตร์ ',
        careers: ["นักวิชาการ", "นักเคมี", "นักฟิสิกส์"],
        studyPlan: 
        [
          "📘 ปี 1 : ปูพื้นฐานวิชาศึกษาทั่วไป วิทยาศาสตร์พื้นฐาน (คณิต ฟิสิกส์ เคมี ชีววิทยา) และวิชาฝึกปฏิบัติ",
          "📗 ปี 2 : วิชาวิทยาศาสตร์ขั้นกลาง เช่น การทดลอง การวิเคราะห์ การวัดผลทางวิทยาศาสตร์ และวิชาเลือกเฉพาะด้าน",
          "📙 ปี 3 : เน้นวิชาวิทยาศาสตร์ขั้นสูง การประยุกต์ใช้ในชีวิตจริง งานวิจัยเบื้องต้น วิชาเลือกเชิงลึก",
          "📕 ปี 4 : ฝึกประสบการณ์วิชาชีพ / สหกิจศึกษา / ทำโครงงานหรือวิจัยอิสระ วิชาเลือกเสรี"
        ],
        studyPlanPdf: "http://academic.uru.ac.th/DB_course/doc_course/144.pdf",
        studyPlanInfoImg: "https://iili.io/FbX6r6N.png",
        website: "https://edu.uru.ac.th/",      
        majorsFacebook: "https://www.facebook.com/scienceeduuru",
        facultyFacebook: "https://www.facebook.com/educationuruacth",
        logoUrl: "https://kharusartsuksa.uru.ac.th/images/uru_logo.png"
      },
      {
        name : 'การประถมศึกษา',
        grade : 2.75,
        ability : ['สอนเด็กประถม', 'บริหารห้องเรียน', 'ออกแบบการเรียนการสอน', 'สอน', 'ครู', 'รักเด็ก', 'เข้าใจในการสอน'], 
        quota : 60,
        requiredEducation: ['มัธยมปลาย', 'ปวช', 'อื่นๆ'],
        condition : "มัธยมศึกษาตอนปลายหรือเทียบเท่าทุกแผนการเรียน",
        reason : 'คุณมีความสามารถด้านการสอนและชอบทำงานกับเด็กประถม เหมาะสมกับการถ่ายทอดความรู้และพัฒนาการเรียนรู้ของเด็ก',
        careers: ["ครูประถมศึกษา", "นักวิชาการด้านการศึกษา", "ครูแนะแนว"],
        studyPlan: 
        [
          "📘 ปี 1 : ปูพื้นฐานวิชาทั่วไปและพื้นฐานวิชาชีพครู เสริมความรู้กว้าง สร้างรากฐานความเป็นครู",
          "📗 ปี 2 : เรียนวิชาเอกหลัก (ภาษาไทย คณิต วิทย์ สังคม ฯลฯ) ฝึกการจัดการเรียนรู้เพื่อพัฒนาทักษะการสอนเบื้องต้น",
          "📙 ปี 3 : ลงลึกวิชาชีพครู วิชาเลือกเฉพาะทาง การวิจัยและนวัตกรรม สร้างทักษะการสอนเชิงสร้างสรรค์",
          "📕 ปี 4 : ฝึกสอนจริงในโรงเรียน ทำคุรุนิพนธ์/วิจัย และก้าวสู่การเป็นครูมืออาชีพอย่างมั่นใจ"
        ],
        studyPlanPdf: "http://academic.uru.ac.th/DB_course/doc_course/155.pdf",
        studyPlanInfoImg: "https://iili.io/FbXQ8Ex.png",
        website: "https://edu.uru.ac.th/",      
        majorsFacebook: "https://www.facebook.com/profile.php?id=100057482228232#",
        facultyFacebook: "https://www.facebook.com/educationuruacth",
        logoUrl: "https://kharusartsuksa.uru.ac.th/images/uru_logo.png"
      },
    ]
  }
];

module.exports = faculties;
