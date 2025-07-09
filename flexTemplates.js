function createFlexPlanSummary(rec) {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `📚 แผนการเรียน: ${rec.name}`,
          weight: "bold",
          size: "lg",
          align: "center"
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
          text: rec.studyPlan.join("\n"),
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
            uri: rec.studyPlanPdf || "https://default-url.com"
          }
        }
      ]
    }
  };
}

module.exports = createFlexPlanSummary;
