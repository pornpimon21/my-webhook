//ดูข้อมูลเพิ่มเติมแผนการเรียน
function createPlanBubble(rec) {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `🗂️ แผนการเรียนของสาขา ${rec.major}`,
          weight: "bold",
          size: "lg",
          wrap: true
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: (rec.studyPlan || []).map(line => ({
        type: "text",
        text: line,
        size: "sm",
        wrap: true
      }))
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          style: "link",
          action: {
            type: "uri",
            label: "📄 ดูแผนการเรียนแบบเต็ม (PDF)",
            uri: rec.studyPlanPdf || "https://example.com/default.pdf"
          }
        },
        {
          type: "button",
          style: "link",
          action: {
            type: "uri",
            label: "🌐 เว็บไซต์คณะ",
            uri: rec.facultyWebsite || "https://uru.ac.th"
          }
        },
        {
          type: "button",
          style: "link",
          action: {
            type: "uri",
            label: "📘 Facebook คณะ",
            uri: rec.facultyFacebook || "https://facebook.com"
          }
        },
        {
          type: "button",
          style: "link",
          action: {
            type: "uri",
            label: "📘 Facebook สาขา",
            uri: rec.majorsFacebook || "https://facebook.com"
          }
        }
      ]
    }
  };
}

module.exports = { createPlanBubble };