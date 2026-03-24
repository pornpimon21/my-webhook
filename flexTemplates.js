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
          text: "📅 แผนการเรียน 📅",
          size: "lg",
          weight: "bold",
          color: "#8E44AD",
          align: "center"
        },
        {
          type: "text",
          text: `🏛️ ${facultyName}`,
          size: "md",
          weight: "bold",
          wrap: true
        },
        {
          type: "text",
          text: `📘 ${majorName}`,
          size: "md",
          weight: "bold",
          wrap: true
        },
        {
          type: "separator",
          margin: "sm",
          color: "#666666"
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
      spacing: "sm",
      contents: [
        {
          type: "text",
          text: "📄 ดูแผนการเรียนฉบับเต็มได้ด้านล่าง 👇",
          size: "sm",
          align: "center",
          color: "#888888",
          margin: "md"
        },
        {
          type: "box",
          layout: "horizontal",
          spacing: "sm",
          contents: [
            {
              type: "button",
              action: {
                type: "uri",
                label: "🔗 หลักสูตร",
                uri: rec.studyPlanPdf || "https://example.com/default.pdf"
              },
              style: "primary",
              color: "#9370DB"
            },
            {
              type: "button",
              action: {
                type: "postback",
                label: "📊 Info",
                data: `action=showInfo&major=${majorName}`
              },
              style: "secondary",
              color: "#FFB6C1"
            }
          ]
        }
      ]
    }
  };
}

// ----------------- postback handler -----------------
async function handlePostback(event, client, faculties) {
  if (!event.postback?.data) return;

  if (event.postback.data.startsWith("action=showInfo")) {
    const params = new URLSearchParams(event.postback.data);
    const majorName = params.get("major");

    let imgUrl = null;
    faculties.forEach(f => {
      f.majors.forEach(m => { 
        if (m.name === majorName) imgUrl = m.studyPlanInfoImg; 
      });
    });

    if (imgUrl) {
      await client.replyMessage(event.replyToken, {
        type: "image",
        originalContentUrl: imgUrl,
        previewImageUrl: imgUrl
      });
    } else {
      await client.replyMessage(event.replyToken, { type: "text", text: "ไม่พบภาพแผนการเรียน" });
    }
  }
}

module.exports = { createPlanCard, handlePostback };
