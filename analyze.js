/**
 * ฟังก์ชันวิเคราะห์ผลตามทฤษฎี RIASEC (Holland Codes)
 * แก้ไข: ให้แสดงจุดเด่น (Traits) เฉพาะของสายงานที่ได้คะแนนสูงสุดเท่านั้น
 */
function analyzeAnswers(answers) {
  const trackScores = {
    'R': 0, 'I': 0, 'A': 0, 'S': 0, 'E': 0, 'C': 0
  };

  // 1. ฟังก์ชันให้คะแนน (Weighting)
  const getWeight = (text) => {
    if (text.includes('ชอบมากที่สุด')) return 5;
    if (text.includes('ชอบมาก')) return 4;
    if (text.includes('เฉยๆ')) return 3;
    if (text.includes('ไม่ค่อยชอบ')) return 2;
    if (text.includes('ไม่ชอบเลย')) return 1;
    return 0;
  };

  // 2. Mapping คำถาม 12 ข้อ
  const mapping = [
    'R', 'R', 'I', 'I', 'A', 'A', 'S', 'S', 'E', 'E', 'C', 'C'
  ];

  const traitDefinitions = {
    'R': 'ถนัดการลงมือทำและใช้เครื่องมือ',
    'I': 'ชอบคิดวิเคราะห์และใช้ตรรกะ',
    'A': 'มีความคิดสร้างสรรค์และรักอิสระ',
    'S': 'ชอบช่วยเหลือและถ่ายทอดความรู้',
    'E': 'มีทักษะผู้นำและการจัดการธุรกิจ',
    'C': 'ละเอียดรอบคอบและเป็นระเบียบ'
  };

  // 3. คำนวณคะแนนรวม (เอา Logic เก็บ Traits ออกไปแล้ว)
  answers.forEach((ans, index) => {
    const code = mapping[index];
    const score = getWeight(ans);
    trackScores[code] += score;
  });

  // 4. หาคะแนนสูงสุด (Max Score)
  let maxScore = -1;
  for (const code in trackScores) {
    if (trackScores[code] > maxScore) {
      maxScore = trackScores[code];
    }
  }

  // 5. หาผู้ชนะ (Winner)
  let bestCodes = [];
  for (const code in trackScores) {
    if (trackScores[code] === maxScore && maxScore > 0) {
      bestCodes.push(code);
    }
  }
  if (bestCodes.length === 0) bestCodes = ['I']; // กันเหนียว

  // 6. สร้างจุดเด่น (Traits) จาก "ผู้ชนะ" เท่านั้น ✅ (แก้ตรงนี้)
  const finalTraits = bestCodes.map(code => traitDefinitions[code]);

  // 7. เตรียมข้อมูลคณะ
const resultData = {
    'R': { 
      title: 'สายปฏิบัติ (Realistic)', 
      faculties: [
        'คณะเทคโนโลยีอุตสาหกรรม (วิศวกรรมบริหารงานก่อสร้าง, วิศวกรรมโลจิสติกส์, วิศวกรรมการจัดการพลังงานฯ, เทคโนโลยีไฟฟ้า, เทคโนโลยีอุตสาหการ, เทคโนโลยีสำรวจและภูมิสารสนเทศ)', 
        'คณะเกษตรศาสตร์ (เกษตรศาสตร์, เทคโนโลยีการอาหาร)',
        'คณะครุศาสตร์ (สาขาเกษตรศาสตร์)'
      ] 
    },
    'I': { 
      title: 'สายวิเคราะห์ (Investigative)', 
      faculties: [
        'คณะวิทยาศาสตร์และเทคโนโลยี (วิทยาการคอมพิวเตอร์, เทคโนโลยีสารสนเทศ, สาธารณสุขศาสตร์, คณิตศาสตร์ประยุกต์, เคมี, ชีววิทยา, สิ่งแวดล้อม)', 
        'คณะครุศาสตร์ (สาขาวิทยาศาสตร์ทั่วไป, คณิตศาสตร์, คอมพิวเตอร์)'
      ] 
    },
    'A': { 
      title: 'สายศิลปิน (Artistic)', 
      faculties: [
        'คณะมนุษยศาสตร์และสังคมศาสตร์ (ทัศนศิลป์, การออกแบบนิเทศศิลป์, ภาษาอังกฤษ, ภาษาอังกฤษเพื่อการสื่อสารและการแปล, ภาษาญี่ปุ่นธุรกิจ, ภาษาจีนธุรกิจ)', 
        'คณะครุศาสตร์ (นาฏศิลป์, ดนตรีศึกษา, ภาษาไทย, ภาษาอังกฤษ, ภาษาจีน, ภาษาเกาหลี)',
        'คณะวิทยาการจัดการ (สาขานิเทศศาสตร์)'
      ] 
    },
    'S': { 
      title: 'สายสังคม (Social)', 
      faculties: [
        'คณะครุศาสตร์ (การประถมศึกษา, การศึกษาปฐมวัย, สังคมศึกษา, พลศึกษา, เทคโนโลยีการศึกษาและคอมพิวเตอร์)', 
        'คณะมนุษยศาสตร์และสังคมศาสตร์ (สังคมศาสตร์เพื่อการพัฒนา, การพัฒนาชุมชน)',
        'คณะวิทยาศาสตร์และเทคโนโลยี (วิทยาศาสตร์การกีฬาและการออกกำลังกาย, อาหารและโภชนาการ)'
      ] 
    },
    'E': { 
      title: 'สายบริหาร (Enterprising)', 
      faculties: [
        'คณะวิทยาการจัดการ (การจัดการธุรกิจสมัยใหม่, การจัดการธุรกิจบริการ, การตลาดดิจิทัล)', 
        'คณะมนุษยศาสตร์และสังคมศาสตร์ (นิติศาสตร์, รัฐประศาสนศาสตร์, ภาษาอังกฤษธุรกิจหลักสูตรนานาชาติ)'
      ] 
    },
    'C': { 
      title: 'สายจัดการ (Conventional)', 
      faculties: [
        'คณะวิทยาการจัดการ (บัญชี, คอมพิวเตอร์ธุรกิจ, เศรษฐกิจดิจิทัล)'
      ] 
    }
  };
  
  const finalTitles = bestCodes.map(code => resultData[code].title);
  const finalFaculties = new Set();
  bestCodes.forEach(code => {
    resultData[code].faculties.forEach(f => finalFaculties.add(f));
  });

  return {
    bestTrack: finalTitles.join(' และ '),
    traits: finalTraits, // ส่งเฉพาะจุดเด่นของผู้ชนะกลับไป
    recommendedFaculties: Array.from(finalFaculties),
    allScores: trackScores
  };
}

module.exports = analyzeAnswers;