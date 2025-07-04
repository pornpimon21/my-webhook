function analyzeAnswers(answers) {
  const trackScores = {
    'สายวิเคราะห์': 0,
    'สายสร้างสรรค์': 0,
    'สายมนุษย์สัมพันธ์': 0,
    'สายบริหาร': 0,
    'สายเทคโนโลยี': 0,
  };
  
  const traits = [];

  // ข้อ 1: วิชาโปรด
  switch(answers[0]) {
    case 'วิทยาศาสตร์ 🔬':
    case 'คณิตศาสตร์ ➗':
      trackScores['สายวิเคราะห์'] += 3;
      break;
    case 'ภาษา 📚':
    case 'ศิลปะ 🎨':
      trackScores['สายสร้างสรรค์'] += 3;
      break;
    case 'สังคม 🌏':
      trackScores['สายมนุษย์สัมพันธ์'] += 3;
      break;
    case 'เทคโนโลยี/คอมพิวเตอร์ 💻':
      trackScores['สายเทคโนโลยี'] += 3;
      break;
  }

  // ข้อ 2: งานแบบไหน
  if (answers[1] === 'คนเดียว 👩‍💻') {
    traits.push('ชอบทำงานอิสระ');
  } else if (answers[1] === 'เป็นทีม 🧑‍🤝‍🧑') {
    traits.push('ชอบทำงานเป็นทีม');
    trackScores['สายมนุษย์สัมพันธ์'] += 1;
    trackScores['สายบริหาร'] += 1;
  } else if (answers[1] === 'ขึ้นอยู่กับงาน ⚖️') {
    traits.push('ปรับตัวได้ดี');
  }

  // ข้อ 3: สนใจเทคโนโลยี
  if (answers[2] === 'มาก 🔥') trackScores['สายเทคโนโลยี'] += 3;
  else if (answers[2] === 'ปานกลาง 👍') trackScores['สายเทคโนโลยี'] += 1;
  else if (answers[2] === 'สนใจเฉพาะบางเรื่อง 🎯') trackScores['สายเทคโนโลยี'] += 2;

  // ข้อ 4: ทักษะถนัด
  switch(answers[3]) {
    case 'คิดวิเคราะห์ 🧠':
      trackScores['สายวิเคราะห์'] += 3;
      traits.push('คิดเชิงตรรกะ');
      break;
    case 'พูดโน้มน้าว 🗣️':
      trackScores['สายมนุษย์สัมพันธ์'] += 3;
      traits.push('สื่อสารเก่ง');
      break;
    case 'เขียน/สร้างสรรค์ ✍️':
      trackScores['สายสร้างสรรค์'] += 3;
      traits.push('สร้างสรรค์');
      break;
    case 'ดูแลคนอื่น 🤗':
      trackScores['สายมนุษย์สัมพันธ์'] += 2;
      traits.push('ใส่ใจคนอื่น');
      break;
    case 'จัดการและวางแผน 📋':
      trackScores['สายบริหาร'] += 3;
      traits.push('มีระเบียบและวางแผนดี');
      break;
  }

  // ข้อ 5: กิจกรรมเวลาว่าง
  if (answers[4] === 'วาดรูป 🎨' || answers[4] === 'อ่านหนังสือ 📚') trackScores['สายสร้างสรรค์'] += 2;
  if (answers[4] === 'เล่นเกม 🎮') traits.push('ชอบแก้ปัญหา');
  if (answers[4] === 'พูดคุยกับคน 🗨️') trackScores['สายมนุษย์สัมพันธ์'] += 2;
  if (answers[4] === 'ออกกำลังกาย 🏃‍♂️') traits.push('ชอบกิจกรรมร่างกาย');
  if (answers[4] === 'ฟังเพลง 🎧') traits.push('ผ่อนคลายด้วยเสียงเพลง');
  if (answers[4] === 'ดูหนัง/ซีรีส์ 🎬') traits.push('ชอบเรียนรู้ผ่านเรื่องราว');
  if (answers[4] === 'ทำอาหาร 🍳') traits.push('ชอบสร้างสรรค์และดูแล');

  // ข้อ 6: เป้าหมายอนาคต
  switch(answers[5]) {
    case 'รายได้ดี 💰':
      traits.push('มุ่งมั่นเรื่องความมั่นคงทางการเงิน');
      break;
    case 'มีอิสระ 🕊️':
      traits.push('ชอบอิสระและความยืดหยุ่น');
      break;
    case 'ได้ช่วยคน 🤝':
      trackScores['สายมนุษย์สัมพันธ์'] += 3;
      traits.push('มีใจช่วยเหลือ');
      break;
    case 'ได้ใช้ความคิดสร้างสรรค์ 🎨💡':
      trackScores['สายสร้างสรรค์'] += 3;
      break;
    case 'มีความมั่นคง 🏠':
      traits.push('ชอบความมั่นคงและปลอดภัย');
      break;
    case 'เป็นผู้นำหรือผู้จัดการ 👩‍💼👨‍💼':
      trackScores['สายบริหาร'] += 3;
      traits.push('มีทักษะความเป็นผู้นำ');
      break;
  }

  // ข้อ 7: การจัดการเวลา
  switch(answers[6]) {
    case 'ชอบวางแผนล่วงหน้า 🗓️':
      traits.push('วางแผนดี มีวินัย');
      break;
    case 'ยืดหยุ่นไปตามสถานการณ์ 🌿':
      traits.push('ปรับตัวได้ดี');
      break;
    case 'จัดลำดับความสำคัญ 🔝':
      traits.push('รู้จักตั้งเป้าหมายชัดเจน');
      break;
    case 'ทำตามใจรู้สึกในขณะนั้น ❤️':
      traits.push('มีความรู้สึกสูง');
      break;
  }

  // ข้อ 8: วิธีตัดสินใจ
  switch(answers[7]) {
    case 'คิดวิเคราะห์และวางแผน 🧠🗓️':
      traits.push('คิดอย่างมีเหตุผล');
      break;
    case 'ฟังความรู้สึกและสัญชาตญาณ 💭❤️':
      traits.push('เชื่อมั่นในสัญชาตญาณ');
      break;
    case 'ขอคำแนะนำจากคนอื่น 🗣️🤝':
      traits.push('เปิดรับความคิดเห็น');
      break;
    case 'รอดูสถานการณ์ก่อนตัดสินใจ 👀⏳':
      traits.push('รอบคอบและรอเวลาเหมาะสม');
      break;
  }

  // หาสายงานที่ได้คะแนนสูงสุด
  let maxScore = -Infinity;
  for (const track in trackScores) {
    if (trackScores[track] > maxScore) {
      maxScore = trackScores[track];
    }
  }

  // เก็บสายงานที่มีคะแนนสูงสุดทั้งหมด (อาจมีมากกว่า 1)
  const bestTracks = [];
  for (const track in trackScores) {
    if (trackScores[track] === maxScore) {
      bestTracks.push(track);
    }
  }

  // ถ้ามีสายงานเดียว คืน bestTrack เป็นชื่อสายงานนั้น
  // ถ้ามากกว่า 1 คืน null (หรือจะคืน bestTracks ก็ได้ตามต้องการ)
  const bestTrack = bestTracks.length === 1 ? bestTracks[0] : null;

  return {
    bestTrack,   // string หรือ null
    bestTracks,  // array ของสายงานที่คะแนนสูงสุด
    traits,
    trackScores
  };
}

module.exports = analyzeAnswers;