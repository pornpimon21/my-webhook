const infoDetailsFlex = {
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
      { type: "text", text: "🎓 คณะ: คณะศึกษาศาสตร์", size: "md", weight: "bold" },
      { type: "text", text: "🏫 สาขา: ภาษาไทย", size: "md", weight: "bold" },
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
          uri: "https://edu.uru.ac.th/"
        }
      },
      {
        type: "button",
        style: "secondary",
        action: {
          type: "uri",
          label: "เฟสสาขา",
          uri: "https://www.facebook.com/profile.php?id=100063988815394#"
        }
      },
      {
        type: "button",
        style: "secondary",
        action: {
          type: "uri",
          label: "เฟสคณะ",
          uri: "https://www.facebook.com/educationuruacth"
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

const studyPlanFlex = {
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
    contents: [
      {
        type: "text",
        text: "📘 ปี 1: วิชาศึกษาทั่วไป พื้นฐานคณะ เช่น คณิต, อังกฤษ",
        wrap: true
      },
      {
        type: "text",
        text: "📗 ปี 2: วิชาเฉพาะสาขาเบื้องต้น",
        wrap: true
      },
      {
        type: "text",
        text: "📙 ปี 3: วิชาเฉพาะเชิงลึก + ภาคปฏิบัติ/โครงการ",
        wrap: true
      },
      {
        type: "text",
        text: "📕 ปี 4: สหกิจ ฝึกงาน หรือโปรเจกต์จบ",
        wrap: true
      },
      {
        type: "button",
        style: "secondary",
        action: {
          type: "uri",
          label: "ดูแผนการเรียนแบบเต็ม (PDF)",
          uri: "http://academic.uru.ac.th/DB_course/doc_course/124.pdf"
        },
        margin: "md"
      },
      {
        type: "button",
        style: "primary",
        action: {
          type: "message",
          label: "กลับ",
          text: "ข้อมูลเพิ่มเติม"
        },
        margin: "md"
      }
    ]
  }
};

module.exports = {
  infoDetailsFlex,
  studyPlanFlex
};
