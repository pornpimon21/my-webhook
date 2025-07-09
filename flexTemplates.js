// flexPlanCard.js

function createPlanCard(facultyName, majorName, rec) {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `📚 แผนการเรียน`,
          size: "lg",
          weight: "bold"
        },
        {
          type: "text",
          text: `${facultyName} - ${majorName}`,
          size: "sm",
          wrap: true,
          margin: "sm"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: rec.studyPlan || "ไม่มีสรุปแผนการเรียน",
          wrap: true,
          size: "sm"
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: "🔗 ดูแผนการเรียนฉบับเต็ม (PDF)",
            uri: rec.studyPlanPdf || "https://example.com/default.pdf"
          },
          style: "primary"
        }
      ]
    }
  };
}

module.exports = { createPlanCard };
