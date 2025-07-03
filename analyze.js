function analyzeAnswers(answers) {
  const result = {
    track: '',
    traits: []
  };

  const favoriteSubject = answers[0];
  if (['วิทย์', 'คณิต'].includes(favoriteSubject)) result.track = 'สายวิเคราะห์';
  else if (['ภาษา', 'ศิลปะ'].includes(favoriteSubject)) result.track = 'สายสร้างสรรค์';
  else result.track = 'สายมนุษย์สัมพันธ์';

  if (answers[1] === 'เป็นทีม') result.traits.push('ทำงานเป็นทีม');
  else result.traits.push('ทำงานอิสระ');

  if (answers[2] === 'มาก') result.traits.push('สนใจเทคโนโลยี');
  if (answers[3] === 'คิดวิเคราะห์') result.traits.push('คิดเชิงตรรกะ');
  if (answers[3] === 'พูดโน้มน้าว') result.traits.push('สื่อสารดี');
  if (answers[3] === 'เขียน/สร้างสรรค์') result.traits.push('สร้างสรรค์');
  if (answers[3] === 'ดูแลคนอื่น') result.traits.push('มีใจบริการ');

  if (answers[4] === 'วาดรูป') result.traits.push('มีจินตนาการ');
  if (answers[4] === 'พูดคุยกับคน') result.traits.push('เข้าสังคมเก่ง');

  if (answers[6] === 'ชอบวางแผนล่วงหน้า') result.traits.push('มีวินัย');
  else result.traits.push('ยืดหยุ่น');

  return result;
}

module.exports = analyzeAnswers;