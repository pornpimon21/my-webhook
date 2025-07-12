function createPlanCard(facultyName, majorName, rec) {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      spacing: "xs",
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
          text: `🏛️ คณะ: ${facultyName}`,
          size: "md",
          weight: "bold",
          wrap: true
        },
        {
          type: "text",
          text: `📘 สาขา: ${majorName}`,
          size: "md",
          weight: "bold",
          wrap: true
        },
        {
          type: "separator",
          margin: "sm",
          color: "#DDDDDD"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        {
          type: "text",
          text: rec.studyPlan ? rec.studyPlan.join('\n\n') : "ไม่มีสรุปแผนการเรียน",
          wrap: true,
          size: "sm"
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        {
          type: "text",
          text: "📄 คลิกดูแผนการเรียนฉบับเต็มข้างล่างได้เลยค่ะ 😊",
          size: "sm",
          align: "center",
          color: "#888888",
          margin: "md"
        },
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
      ]
    }
  };
}

module.exports = { createPlanCard };
