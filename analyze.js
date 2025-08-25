import openai from 'openai';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// 我们不再指定Edge运行时，让Vercel使用默认的Node.js环境
// export const config = {
//   runtime: 'edge',
// };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    // 使用 res.status().json() 的标准Node.js方式返回
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not set in environment variables.');
    return res.status(500).json({ error: 'Server config error: API Key not set.' });
  }

  try {
    // 注意：在标准Node.js环境中，我们不能直接用 req.json()
    // 而是用 Vercel 提供的 req.body
    const { text } = req.body; 

    const client = new openai.OpenAI({
      apiKey: GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1'
    } );

    const response = await client.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: "You are an AI assistant. Analyze the schedule and give advice in Chinese." },
        { role: 'user', content: `请分析日程: ${text}` }
      ],
      // 我们暂时关闭流式，回到简单的请求-响应模式来调试
      // stream: true, 
    });

    const analysis = response.choices[0]?.message?.content || 'AI没有返回内容。';
    
    // 以标准的JSON格式返回成功响应
    res.status(200).json({ analysis: analysis });

  } catch (err) {
    console.error('Server-side error:', err);
    res.status(500).json({ error: `Analysis failed: ${err.message}` });
  }
}
