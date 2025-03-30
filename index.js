const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post("/webhook", (req, res) => {
    const intent = req.body.queryResult.intent.displayName;
    let responseText = "ไม่เข้าใจคำถาม";

    if (intent === "HelloIntent") {
        responseText = "สวัสดี! ยินดีที่ได้รู้จัก";
    }

    res.json({ fulfillmentText: responseText });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
