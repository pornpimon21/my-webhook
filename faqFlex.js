const faqFlex = {
  type: "flex",
  altText: "📚 คำถามที่พบบ่อย",
  contents: {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        {
          type: "text",
          text: "📚 คำถามที่พบบ่อย (FAQ)",
          weight: "bold",
          size: "lg",
          color: "#2E7D32", // เขียวเข้ม
          align: "center",
        },
        {
          type: "text",
          text: "เลือกคำถามที่คุณอยากรู้ ระบบจะตอบกลับให้ทันที 😊",
          size: "sm",
          color: "#555555",
          wrap: true,
        },
        {
          type: "separator",
          margin: "md",
        },
        {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          margin: "lg",
          contents: [
            {
              type: "button",
              style: "primary",
              color: "#81C784",  // เขียวพาสเทล
              action: {
                type: "message",
                label: "🔍 ระบบทำงานอย่างไร?",
                text: "ระบบทำงานอย่างไร?",
              },
            },
            {
              type: "button",
              style: "primary",
              color: "#4DB6AC",  // น้ำเงินเขียวพาสเทล
              action: {
                type: "message",
                label: "⏱ ใช้เวลานานไหม?",
                text: "ใช้เวลานานไหม?",
              },
            },
            {
              type: "button",
              style: "primary",
              color: "#7986CB",  // ม่วงพาสเทล
              action: {
                type: "message",
                label: "🚀 เริ่มใช้งานยังไง?",
                text: "เริ่มใช้งานยังไง?",
              },
            },
            {
              type: "button",
              style: "primary",
              color: "#FFF176",  // เหลืองพาสเทล
              action: {
                type: "message",
                label: "🎯 ทำแบบทดสอบได้กี่ครั้ง?",
                text: "ทำแบบทดสอบได้กี่ครั้ง?",
              },
            },
            {
              type: "button",
              style: "primary",
              color: "#B0BEC5",  // เทาพาสเทล
              action: {
                type: "message",
                label: "🔒 ข้อมูลส่วนตัวปลอดภัยไหม?",
                text: "ข้อมูลส่วนตัวปลอดภัยไหม?",
              },
            },
          ],
        },
      ],
    },
  },
};

const faqs = {
  "ระบบทำงานอย่างไร?": "ระบบของเราจะตอบคำถามผ่านการส่งข้อความและเมนูแบบปุ่ม เพื่อให้คุณได้รับคำตอบอย่างรวดเร็วและสะดวก",
  "ใช้เวลานานไหม?": "โดยปกติการทำงานจะรวดเร็วภายในไม่กี่วินาที ไม่ต้องรอนาน",
  "เริ่มใช้งานยังไง?": "เริ่มต้นโดยการสมัครสมาชิกและล็อกอินเข้าสู่ระบบ หลังจากนั้นคุณสามารถใช้งานได้ทันที",
  "ทำแบบทดสอบได้กี่ครั้ง?": "คุณสามารถทำแบบทดสอบได้ไม่จำกัดจำนวนครั้งตามที่ต้องการ",
  "ข้อมูลส่วนตัวปลอดภัยไหม?": "เรารักษาข้อมูลของคุณอย่างเข้มงวดและปลอดภัยตามมาตรฐานสากล",
};

module.exports = { faqFlex, faqs };
