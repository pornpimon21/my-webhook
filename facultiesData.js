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
        studyPlan: [ "📘 ปี 1: วิชาศึกษาทั่วไป พื้นฐานคณะ เช่น คณิต, อังกฤษ","📗 ปี 2: วิชาเฉพาะสาขาเบื้องต้น","📙 ปี 3: วิชาเฉพาะเชิงลึก + ภาคปฏิบัติ/โครงการ","📕 ปี 4: สหกิจ ฝึกงาน หรือโปรเจกต์จบ"],
        studyPlanPdf: "http://academic.uru.ac.th/DB_course/doc_course/124.pdf",
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
        careers: ["นักวิชาการ", "นักเคมี", "นักฟิสิกส์"]
      }
    ]
  }
];

module.exports = faculties;
