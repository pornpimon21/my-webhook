function createFlexPlanSummary(facultyName, majorName, rec) {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `📚 แผนการเรียนสรุป: ${facultyName} - ${majorName}`,
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
          // ตรวจสอบว่า studyPlan เป็น array หรือไม่ก่อน join
          text: Array.isArray(rec.studyPlan) ? rec.studyPlan.join("\n") : "ไม่มีข้อมูลแผนการเรียน",
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
            uri: rec.studyPlanPdf || "https://yourdomain.com/default.pdf"
          }
        }
      ]
    }
  };
}

module.exports = createFlexPlanSummary;
