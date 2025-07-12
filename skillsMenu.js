const questions = require('./questions');

const questionColors = [
  [
    '#54C6C2', // ฟ้าน้ำทะเลเข้มขึ้นจาก #72D6D3
    '#FF6DC2', // ชมพูสดขึ้นจาก #FF90CF
    '#5ED7A1', // เขียวมิ้นต์เข้มขึ้นจาก #7FE4B3
    '#FF8B5B', // ส้มพีชเข้มขึ้นจาก #FFA982
    '#9C6BE0', // ม่วงพาสเทลเข้มขึ้นจาก #B580F2
    '#D18B00', // เหลืองทองอมส้ม (ใหม่แทน #D4B300 ให้เข้ากับโทน)
    '#59B2E5', // ฟ้าเข้มพาสเทลจาก #89CFF0
    '#FF9296'  // แดงพาสเทลเข้มขึ้นจาก #FFB6B9
  ]
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
                backgroundColor: '#1DB446', // 🟢 ใช้สีเขียวตายตัว
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
