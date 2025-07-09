// ฟังก์ชันสร้าง flex message แผนการเรียน
function createFlexPlanSummary(facultyName, major) {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `📚 แผนการเรียนสรุป: ${facultyName} - ${major.name}`,
          weight: "bold",
          size: "lg",
          align: "center",
          wrap: true
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "text",
          text: major.studyPlan.join("\n"),
          size: "sm",
          wrap: true
        },
        {
          type: "button",
          style: "link",
          height: "sm",
          action: {
            type: "uri",
            label: "ดูแผนการเรียนเต็ม (PDF)",
            uri: major.studyPlanPdf || "https://yourdomain.com/default.pdf"
          }
        }
      ]
    }
  };
}

module.exports = createFlexPlanSummary;
