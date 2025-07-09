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
          margin: "none"   // ลด margin บน-ล่าง
        },
        {
          type: "text",
          text: `🏛️ คณะ : ${facultyName}\n📘 สาขา : ${majorName}`,
          size: "sm",
          wrap: true,
          margin: "none"   // ลดช่องว่างบรรทัดนี้
        }
      ],
      paddingBottom: "none"  // ลดช่องว่างระหว่าง header กับ body
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: rec.studyPlan ? rec.studyPlan.join('\n') : "ไม่มีสรุปแผนการเรียน",
          wrap: true,
          size: "sm"
        },
        {
          type: "text",
          text: "นี่เป็นแค่แผนการเรียนแบบสรุป หากสนใจดูเแผนการเรียนฉบับต็มสามารถคลิกปุ่มข้างล่างได้เลยค่ะ 😊",
          wrap: true,
          size: "xs",
          color: "#999999",
          margin: "md"
        }
      ],
      paddingTop: "none" // ลดช่องว่างระหว่าง body กับ header
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
          }
        }
      ]
    }
  };
}

module.exports = { createPlanCard };
