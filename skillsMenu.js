const questions = require('./questions');

const questionColors = [
  '#72D6D3', // ฟ้าน้ำทะเลเข้มขึ้น
  '#FF90CF', // ชมพูสดขึ้น
  '#7FE4B3', // เขียวมิ้นต์เข้ม
  '#FFA982', // ส้มพีชเข้ม
  '#B580F2', // ม่วงพาสเทลเข้ม
  '#D4B300', // เหลืองทองอมส้ม
  '#89CFF0',  // ฟ้าเข้มพาสเทล
  '#FFB6B9' // แดงพาสเทลชมพูอ่อน
];

function buildQuestionFlex(step) {
  const q = questions[step];
  const color = questionColors[step] || '#1DB446';
  const total = questions.length;
  const progressPercent = Math.round(((step + 1) / total) * 100);

  const buttons = q.options.map(opt => ({
    type: 'button',
    style: 'primary',
    color: color,
    height: 'sm',
    action: {
      type: 'message',
      label: opt,
      text: opt
    }
  }));

  return {
    type: 'flex',
    altText: `คำถาม ${step + 1}/${total}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: `ข้อ ${step + 1}/${total} (${progressPercent}%)`,
            weight: 'bold',
            size: 'sm',
            color: '#999999'
          },
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
        contents: [
          ...buttons,
          {
            type: 'box',
            layout: 'horizontal',
            height: '4px',
            backgroundColor: '#E0E0E0',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                width: `${progressPercent}%`,
                backgroundColor: color,
                contents: []
              }
            ]
          }
        ]
      }
    }
  };
}

module.exports = { buildQuestionFlex };
