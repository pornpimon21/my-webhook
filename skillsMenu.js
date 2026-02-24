const questions = require('./questions');

const questionColors = [
  '#54C6C2', // ฟ้าน้ำทะเลเข้มขึ้นจาก #72D6D3
  '#FF6DC2', // ชมพูสดขึ้นจาก #FF90CF
  '#5ED7A1', // เขียวมิ้นต์เข้มขึ้นจาก #7FE4B3
  '#FF8B5B', // ส้มพีชเข้มขึ้นจาก #FFA982
  '#9C6BE0', // ม่วงพาสเทลเข้มขึ้นจาก #B580F2
  '#a0633ae8', // น้ำตาล
  '#59B2E5', // ฟ้าเข้มพาสเทลจาก #89CFF0
  '#f86a71',  // แดงพาสเทลเข้มจาก #FFB6B9
  '#F5C342', // 9. เหลืองมัสตาร์ด 
  '#5D6D7E', // 10. น้ำเงินเทา 
  '#A3CB38', // 11. เขียวมะกอกสดใส 
  '#7D3C98'  // 12. ม่วงเปลือกมังคุด 
];

// ✅ ฟังก์ชันสำหรับไล่เฉดสีเขียวจากอ่อน → เข้ม
function getProgressColor(percent) {
  const start = { r: 168, g: 230, b: 163 }; // เขียวอ่อน (#A8E6A3)
  const end = { r: 29, g: 180, b: 70 };     // เขียวเข้ม (#1DB446)

  const r = Math.round(start.r + ((end.r - start.r) * percent) / 100);
  const g = Math.round(start.g + ((end.g - start.g) * percent) / 100);
  const b = Math.round(start.b + ((end.b - start.b) * percent) / 100);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function buildQuestionFlex(step) {
  const q = questions[step];
  const color = questionColors[step] || '#1DB446';
  const total = questions.length;
  const progressPercent = Math.round(((step + 1) / total) * 100);
  const progressColor = getProgressColor(progressPercent);

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
                backgroundColor: progressColor,
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
