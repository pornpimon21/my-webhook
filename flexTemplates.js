function createPlanCard(facultyName, majorName, rec) {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "📚 แผนการเรียน 📚",
          size: "lg",
          weight: "bold",
          color: "#8E44AD",
          align: "center"
        },
        {
          type: "text",
          text: `🏛️ ${facultyName} 📘 สาขา${majorName}`,
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
          type: "separator",
          margin: "sm",
          color: "#DDDDDD"
        },
        {
          type: "text",
          text: rec.studyPlan ? rec.studyPlan.join('\n\n') : "ไม่มีสรุปแผนการเรียน",
          wrap: true,
          size: "sm",
          margin: "md"
        },
        {
          type: "text",
          text: "📄 นี่เป็นแค่แผนการเรียนแบบสรุป หากสนใจดูแผนการเรียนฉบับเต็มสามารถคลิกปุ่มข้างล่างได้เลยค่ะ 😊",
          wrap: true,
          size: "xs",
          color: "#888888",
          margin: "md",
          align: "center"
        }
      ],
      spacing: "md"
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
          style: "primary",
          color: "#4A90E2"
        }
      ],
      spacing: "md"
    }
  };
}

module.exports = { createPlanCard };
