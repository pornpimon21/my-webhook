/**
 * ฟังก์ชันวิเคราะห์ผลตามทฤษฎี RIASEC (Holland Codes)
 * อ้างอิง: O*NET Interest Profiler และ กรมการจัดหางาน
 */
function analyzeAnswers(answers) {
  // 1. กำหนดโครงสร้างคะแนน 6 ด้าน
  const trackScores = {
    'R': 0, 'I': 0, 'A': 0, 'S': 0, 'E': 0, 'C': 0
  };

  // 2. ฟังก์ชันตรวจสอบคะแนนจากข้อความบนปุ่ม (Weighted Scoring)
  const getWeight = (text) => {
    if (text.includes('ชอบมาก')) return 3; // คะแนนเต็มสำหรับด้านนั้น
    if (text.includes('เฉยๆ')) return 1;  // คะแนนปานกลาง
    return 0; // ไม่ชอบ ได้ 0
  };

  // 3. สะสมคะแนนแยกตามข้อ (1 ข้อ รับผิดชอบ 1 ด้าน RIASEC)
  const mapping = ['R', 'I', 'A', 'S', 'E', 'C'];
  answers.forEach((ans, index) => {
    const code = mapping[index];
    trackScores[code] = getWeight(ans);
  });

  // 4. หาสายงานที่ได้คะแนนสูงสุด (Dominant Type)
  let maxScore = -1;
  let bestCode = 'I'; // Default กรณีคะแนนเท่ากันหมด
  for (const code in trackScores) {
    if (trackScores[code] > maxScore) {
      maxScore = trackScores[code];
      bestCode = code;
    }
  }

  // 5. ฐานข้อมูลคณะและสาขาวิชา (Mapping Table)
  const resultData = {
    'R': {
      title: 'สายปฏิบัติ (Realistic)',
      desc: 'คุณถนัดงานที่ต้องลงมือทำจริง ใช้เครื่องมือ และทักษะทางกายภาพ',
      faculties: ['คณะเทคโนโลยีอุตสาหกรรม', 'คณะเกษตรศาสตร์', 'วิทยาศาสตร์การกีฬา']
    },
    'I': {
      title: 'สายวิเคราะห์ (Investigative)',
      desc: 'คุณเก่งเรื่องการคิดวิเคราะห์ ใช้เหตุผล และหาคำตอบเชิงตรรกะ',
      faculties: ['คณะวิทยาศาสตร์และเทคโนโลยี', 'วิทยาการคอมพิวเตอร์', 'IT']
    },
    'A': {
      title: 'สายศิลปิน (Artistic)',
      desc: 'คุณมีความคิดสร้างสรรค์สูง รักอิสระ และกล้าแสดงออก',
      faculties: ['คณะมนุษยศาสตร์และสังคมศาสตร์', 'นิเทศศาสตร์', 'ศิลปกรรม']
    },
    'S': {
      title: 'สายสังคม (Social)',
      desc: 'คุณเด่นด้านการเข้าสังคม ชอบช่วยเหลือ และสื่อสารกับผู้คนได้ดี',
      faculties: ['คณะครุศาสตร์ (ครู)', 'พยาบาลศาสตร์', 'สาธารณสุขศาสตร์']
    },
    'E': {
      title: 'สายบริหาร (Enterprising)',
      desc: 'คุณมีความเป็นผู้นำ มีวาทศิลป์ในการโน้มน้าว และชอบความท้าทาย',
      faculties: ['คณะวิทยาการจัดการ', 'บริหารธุรกิจ', 'นิติศาสตร์/รัฐศาสตร์']
    },
    'C': {
      title: 'สายจัดการ (Conventional)',
      desc: 'คุณเป็นคนมีระเบียบ วางแผนเก่ง และจัดการข้อมูลได้อย่างแม่นยำ',
      faculties: ['บัญชีและการเงิน', 'เศรษฐศาสตร์', 'จัดการสารสนเทศ']
    }
  };

  const finalResult = resultData[bestCode];

  return {
    bestTrack: finalResult.title,
    description: finalResult.desc,
    recommendedFaculties: finalResult.faculties,
    allScores: trackScores
  };
}

module.exports = analyzeAnswers;