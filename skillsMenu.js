const questions = require('./questions');

function buildQuestionFlex(step) {
  const q = questions[step];
  const buttons = q.options.map(opt => ({
    type: 'button',
    style: 'primary',
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
          { type: 'text', text: q.text, wrap: true, weight: 'bold', size: 'md' },
          ...buttons
        ]
      }
    }
  };
}

module.exports = { buildQuestionFlex };
