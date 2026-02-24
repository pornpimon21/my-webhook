/**
 * ฟังก์ชันวิเคราะห์ผลตามทฤษฎี RIASEC (Holland Codes)
 * อัปเกรดรองรับคำถาม 12 ข้อ และการให้คะแนน 5 ระดับ (Likert Scale)
 * อ้างอิง: O*NET Interest Profiler และ กรมการจัดหางาน
 */
function analyzeAnswers(answers) {
  // 1. กำหนดคะแนนเริ่มต้นสำหรับ 6 ด้าน
  const trackScores = {
    'R': 0, 'I': 0, 'A': 0, 'S': 0, 'E': 0, 'C': 0
  };

  // เก็บจุดเด่นของผู้ใช้
  const traits = [];

  // 2. ฟังก์ชันให้คะแนน 5 ระดับ (Weighting)
  const getWeight = (text) => {
    if (text.includes('ชอบมากที่สุด')) return 5;
    if (text.includes('ชอบมาก')) return 4;
    if (text.includes('เฉยๆ')) return 3;
    if (text.includes('ไม่ค่อยชอบ')) return 2;
    if (text.includes('ไม่ชอบเลย')) return 1;
    return 0; // กรณี Error หรือไม่มีค่า
  };

  // 3. ลำดับการ Mapping (2 ข้อต่อ 1 ด้านบุคลิกภาพ)
  const mapping = [
    'R', 'R', // ข้อ 1, 2
    'I', 'I', // ข้อ 3, 4
    'A', 'A', // ข้อ 5, 6
    'S', 'S', // ข้อ 7, 8
    'E', 'E', // ข้อ 9, 10
    'C', 'C'  // ข้อ 11, 12
  ];

  const traitDefinitions = {
    'R': 'ถนัดการลงมือทำและใช้เครื่องมือ',
    'I': 'ชอบคิดวิเคราะห์และใช้ตรรกะ',
    'A': 'มีความคิดสร้างสรรค์และศิลปะ',
    'S': 'ชอบช่วยเหลือและถ่ายทอดความรู้',
    'E': 'มีทักษะผู้นำและการจัดการธุรกิจ',
    'C': 'ละเอียดรอบคอบและเป็นระบบ'
  };

  // 4. วนลูปคำนวณคะแนน
  answers.forEach((ans, index) => {
    const code = mapping[index];
    const score = getWeight(ans);
    trackScores[code] += score; // สะสมคะแนน (แต่ละด้านจะมีคะแนนเต็ม 10)

    // เก็บจุดเด่น: ถ้าคะแนนข้อนั้นๆ สูง (4 หรือ 5) ให้บันทึก trait
    if (score >= 4 && !traits.includes(traitDefinitions[code])) {
      traits.push(traitDefinitions[code]);
    }
  });

  // 5. หาคะแนนที่สูงที่สุด (รองรับกรณีคะแนนเท่ากัน)
  let maxScore = -1;
  for (const code in trackScores) {
    if (trackScores[code] > maxScore) {
      maxScore = trackScores[code];
    }
  }

  // เก็บสายงานที่มีคะแนนเท่ากับ maxScore ทั้งหมด
  let bestCodes = [];
  for (const code in trackScores) {
    if (trackScores[code] === maxScore && maxScore > 0) {
      bestCodes.push(code);
    }
  }

  // กรณีคะแนนต่ำมากหรือไม่เลือกเลย ให้ Default ที่สายวิเคราะห์
  if (bestCodes.length === 0) bestCodes = ['I'];

  // 6. ฐานข้อมูลคณะและสาขาวิชา (Mapping Table)
  const resultData = {
    'R': {
      title: 'สายปฏิบัติ (Realistic)',
      faculties: ['คณะเทคโนโลยีอุตสาหกรรม', 'คณะเกษตรศาสตร์', 'วิทยาศาสตร์การกีฬา']
    },
    'I': {
      title: 'สายวิเคราะห์ (Investigative)',
      faculties: ['คณะวิทยาศาสตร์และเทคโนโลยี', 'สาขาวิทยาการคอมพิวเตอร์/IT', 'พยาบาลศาสตร์']
    },
    'A': {
      title: 'สายศิลปิน (Artistic)',
      faculties: ['คณะมนุษยศาสตร์และสังคมศาสตร์', 'นิเทศศาสตร์', 'ดนตรี/ศิลปะและการออกแบบ']
    },
    'S': {
      title: 'สายสังคม (Social)',
      faculties: ['คณะครุศาสตร์ (ทุกสาขา)', 'สาธารณสุขศาสตร์', 'การพัฒนาชุมชน']
    },
    'E': {
      title: 'สายบริหาร (Enterprising)',
      faculties: ['คณะวิทยาการจัดการ', 'บริหารธุรกิจ', 'นิติศาสตร์/รัฐศาสตร์']
    },
    'C': {
      title: 'สายจัดการ (Conventional)',
      faculties: ['สาขาการบัญชี', 'การเงินและการธนาคาร', 'เศรษฐศาสตร์']
    }
  };

  // 7. รวบรวมผลลัพธ์ (ชื่อสายงานและรายชื่อคณะ)
  const finalTitles = bestCodes.map(code => resultData[code].title);
  const finalFaculties = new Set();
  bestCodes.forEach(code => {
    resultData[code].faculties.forEach(f => finalFaculties.add(f));
  });

  return {
    bestTrack: finalTitles.join(' และ '),
    traits: traits.length > 0 ? traits : ["มีความตั้งใจในการเรียนรู้สิ่งใหม่"],
    recommendedFaculties: Array.from(finalFaculties),
    allScores: trackScores
  };
}

module.exports = analyzeAnswers;