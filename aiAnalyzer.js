const faculties = require('./facultiesData');

function aiAnalyzeUserText(userText) {

  // 1️⃣ NLP: แปลงข้อความเป็น token
  const tokens = userText
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);

  let results = [];

  faculties.forEach(faculty => {
    faculty.majors.forEach(major => {

      // 2️⃣ Knowledge Base ของแต่ละสาขา
      const knowledgeText = [
        ...major.ability,
        major.majorDescription
      ].join(" ").toLowerCase();

      // 3️⃣ AI Scoring
      let score = 0;
      let matchedKeywords = [];

      tokens.forEach(word => {
        if (knowledgeText.includes(word)) {
          score += 1;
          matchedKeywords.push(word);
        }
      });

      // 4️⃣ เก็บเฉพาะที่ AI มองว่า “มีความเหมาะสม”
      if (score > 0) {
        results.push({
          faculty: faculty.name,
          major: major.name,
          score,
          matchedKeywords: [...new Set(matchedKeywords)],
          majorInfo: major
        });
      }
    });
  });

  // 5️⃣ AI Ranking
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

module.exports = aiAnalyzeUserText;
