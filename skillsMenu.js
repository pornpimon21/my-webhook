const questions = require('./questions');

const questionColors = [
  '#A0E7E5', // ฟ้าน้ำทะเล สดใส
  '#FFB5E8', // ชมพูพาสเทล อ่อนโยน
  '#B4F8C8', // เขียวมิ้นต์ สดชื่น
  '#FFDAC1', // ส้มพีช ดูอบอุ่น
  '#E2F0CB', // เขียวอ่อน ธรรมชาติ
  '#D5AAFF', // ม่วงพาสเทลสงบ
  '#FBE7C6'  // ครีมทองนุ่มนวล
];
function buildQuestionFlex(step) {
  const q = questions[step];
  const color = questionColors[step] || '#1DB446'; // สีเขียว default

  const buttons = q.options.map(opt => ({
    type: 'button',
    style: 'primary',
    color: color,
    action: {
      type: 'message',
      label: opt,
      text: opt
    }
  }));

  return {
    type: 'flex',
    altText: `คำถาม ${step + 1}`,
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: q.text,
            wrap: true,
            weight: 'bold',
            size: 'md',
            color: '#000000'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: buttons
      }
    }
  };
}

module.exports = { buildQuestionFlex };
