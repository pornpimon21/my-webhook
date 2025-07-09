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
          weight: "bold",
          margin: "none"
        },
        {
          type: "text",
          text: `🏛️ คณะ : ${facultyName}  📘 สาขา : ${majorName}`,
          size: "sm",
          wrap: true,
          margin: "md"
        }
      ],
      paddingBottom: "lg"  // เว้นห่างระหว่าง header กับ body เยอะขึ้น
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: rec.studyPlan ? rec.studyPlan.join('\n\n') : "ไม่มีสรุปแผนการเรียน",
          wrap: true,
          size: "sm",
          margin: "none"
        },
        {
          type: "text",
          text: "นี่เป็นแค่แผนการเรียนแบบสรุป หากสนใจดูแผนการเรียนฉบับเต็มสามารถคลิกปุ่มข้างล่างได้เลยค่ะ 😊",
          wrap: true,
          size: "xs",
          color: "#999999",
          margin: "md"
        }
      ],
      spacing: "md",    // เว้นระยะห่างระหว่างข้อความใน body
      paddingTop: "none"
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
      ],
      spacing: "md"
    }
  };
}

module.exports = { createPlanCard };
