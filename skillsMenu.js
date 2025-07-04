const questions = require('./questions');

const questionColors = [
  '#72D6D3', // ฟ้าน้ำทะเลเข้มขึ้น
  '#FF90CF', // ชมพูสดขึ้น
  '#7FE4B3', // เขียวมิ้นต์เข้ม
  '#FFA982', // ส้มพีชเข้ม
  '#B580F2', // ม่วงพาสเทลเข้ม
  '#D4B300',  // เหลืองทองอมส้ม
  '#89CFF0'  // ฟ้าเข้มพาสเทล
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
