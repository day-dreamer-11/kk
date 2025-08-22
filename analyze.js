// 文件路径: analyze.js (最终修正版)

module.exports = async (req, res) => {
  // --- CORS 和请求方法检查 (保持不变) ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  // ------------------------------------

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "服务器配置错误：缺少 API 密钥。" });
    }

    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ message: '请求中未包含任何文本内容。' });
    }

    // 【【【 已修正 #1 】】】 使用 v1 版本的 API，并指定模型
    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    const prompt = `你是一位专业的日程管理和效率优化助手 。请根据用户提供的以下日程文本，以清晰、有条理、易于阅读的方式给出总结和具体的优化建议。\n\n日程内容：\n${data}`;

    const geminiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "contents": [{ "parts": [{ "text": prompt }] }]
      })
    });

    const resultData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini API Error:", resultData);
      const errorMessage = resultData?.error?.message || 'Gemini API 返回未知错误。';
      return res.status(geminiResponse.status).json({ message: `Gemini API 错误: ${errorMessage}` });
    }

    const analysisResult = resultData.candidates[0].content.parts[0].text;
    return res.status(200).json({ result: analysisResult });

  } catch (error) {
    console.error("Internal Server Error:", error);
    return res.status(500).json({ message: '服务器发生意外错误，请稍后重试。' });
  }
};
