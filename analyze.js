/**
 * ฟังก์ชันวิเคราะห์ผลตามทฤษฎี RIASEC (Holland Codes)
 * อ้างอิง: O*NET Interest Profiler และ กรมการจัดหางาน
 */
function analyzeAnswers(answers) {
  const trackScores = {
    'R': 0, 'I': 0, 'A': 0, 'S': 0, 'E': 0, 'C': 0
  };

  // สร้างตัวแปรไว้เก็บจุดเด่นเพื่อส่งกลับไปแสดงใน Flex Message
  const traits = [];

  const getWeight = (text) => {
    if (text.includes('ชอบมาก')) return 3; 
    if (text.includes('เฉยๆ')) return 1;  
    return 0; 
  };

  const mapping = ['R', 'I', 'A', 'S', 'E', 'C'];
  
  // นิยามจุดเด่นสำหรับแต่ละด้าน
  const traitDefinitions = {
    'R': 'ถนัดการลงมือทำและใช้เครื่องมือ',
    'I': 'ชอบคิดวิเคราะห์และใช้ตรรกะ',
    'A': 'มีความคิดสร้างสรรค์และรักอิสระ',
    'S': 'มีจิตอาสาและชอบช่วยเหลือผู้อื่น',
    'E': 'มีความเป็นผู้นำและกล้าตัดสินใจ',
    'C': 'มีความรอบคอบและเป็นระเบียบ'
  };

  answers.forEach((ans, index) => {
    const code = mapping[index];
    const score = getWeight(ans);
    trackScores[code] = score;

    // ถ้าคะแนนเป็น "ชอบมาก" (3 แต้ม) ให้เพิ่มจุดเด่นลงในอาเรย์ traits
    if (score === 3) {
      traits.push(traitDefinitions[code]);
    }
  });

  let maxScore = -1;
  let bestCode = 'I'; 
  for (const code in trackScores) {
    if (trackScores[code] > maxScore) {
      maxScore = trackScores[code];
      bestCode = code;
    }
  }

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

  // คืนค่า traits กลับไปด้วยเสมอ (ถ้าไม่มีให้คืนอาเรย์ว่าง []) ป้องกัน Error .length
  return {
    bestTrack: finalResult.title,
    description: finalResult.desc,
    traits: traits.length > 0 ? traits : ["มีความมุ่งมั่นในการเรียนรู้"],
    recommendedFaculties: finalResult.faculties,
    allScores: trackScores
  };
}

module.exports = analyzeAnswers;