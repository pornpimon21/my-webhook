const questions = require('./questions');

const questionColors = [
  '#FF6F61', // สีแดงอมส้ม สำหรับคำถาม 1
  '#6B5B95', // สีม่วง สำหรับคำถาม 2
  '#88B04B', // สีเขียว สำหรับคำถาม 3
  '#F7CAC9', // สีชมพูอ่อน สำหรับคำถาม 4
  '#92A8D1', // สีฟ้า สำหรับคำถาม 5
  '#955251', // สีแดงเข้ม สำหรับคำถาม 6
  '#B565A7'  // สีม่วงอมชมพู สำหรับคำถาม 7
];

function buildQuestionFlex(step) {
  const q = questions[step];
  const color = questionColors[step] || '#1DB446'; // ถ้าเกินจำนวนสี จะใช้สีเขียว default

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
          { type: 'text', text: q.text, wrap: true, weight: 'bold', size: 'md', color: color }
        ],
        footer: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: buttons
        }
      }
    }
  };
}

module.exports = { buildQuestionFlex };
