function generateInfoDetailsFlex(data) {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "ข้อมูลเพิ่มเติม",
          weight: "bold",
          size: "xl",
          align: "center"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        { type: "text", text: `🎓 คณะ: ${data.faculty}`, size: "md", weight: "bold" },
        { type: "text", text: `🏫 สาขา: ${data.major}`, size: "md", weight: "bold" },
        { type: "separator", margin: "md" },
        {
          type: "button",
          style: "primary",
          action: {
            type: "postback",
            label: "แผนการเรียน",
            data: "action=show_study_plan"
          }
        },
        {
          type: "button",
          style: "secondary",
          action: {
            type: "uri",
            label: "เว็บไซต์คณะ",
            uri: data.website
          }
        },
        {
          type: "button",
          style: "secondary",
          action: {
            type: "uri",
            label: "เฟสสาขา",
            uri: data.majorsFacebook
          }
        },
        {
          type: "button",
          style: "secondary",
          action: {
            type: "uri",
            label: "เฟสคณะ",
            uri: data.facultyFacebook
          }
        },
        {
          type: "button",
          style: "primary",
          action: {
            type: "message",
            label: "เริ่มใหม่",
            text: "เริ่มแนะนำใหม่"
          },
          margin: "md"
        }
      ]
    }
  };
}

function generateStudyPlanFlex(data) {
  const contents = data.studyPlan.map((item) => ({
    type: "text",
    text: item,
    wrap: true
  }));

  contents.push({
    type: "button",
    style: "secondary",
    action: {
      type: "uri",
      label: "ดูแผนการเรียนแบบเต็ม (PDF)",
      uri: data.studyPlanPdf
    },
    margin: "md"
  });

  contents.push({
    type: "button",
    style: "primary",
    action: {
      type: "message",
      label: "กลับ",
      text: "ข้อมูลเพิ่มเติม"
    },
    margin: "md"
  });

  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "แผนการเรียน",
          weight: "bold",
          size: "xl",
          align: "center"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents
    }
  };
}

module.exports = {
  generateInfoDetailsFlex,
  generateStudyPlanFlex
};
