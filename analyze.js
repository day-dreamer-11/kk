import openai from 'openai';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// 我们不再指定Edge运行时，使用默认的、兼容性最好的Node.js环境
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not set in environment variables.');
    return res.status(500).json({ error: 'Server config error: API Key not set.' });
  }

  try {
    const { text } = req.body;

    const client = new openai.OpenAI({
      apiKey: GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1'
    } );

    // 开启流式响应
    const stream = await client.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: "You are an AI assistant. Analyze the schedule and give advice in Chinese." },
        { role: 'user', content: `请分析日程: ${text}` }
      ],
      stream: true, // <--- 关键：开启流模式
    });

    // 设置响应头，告诉浏览器我们要发送一个文本流
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    });

    // 循环处理数据流
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      // 将每个数据块直接写入响应流，发送给前端
      res.write(content);
    }

    // 所有数据块都发送完毕后，结束响应
    res.end();

  } catch (err) {
    console.error('Server-side error:', err);
    // 如果发生错误，确保也结束响应
    if (!res.writableEnded) {
      res.end(`Analysis failed: ${err.message}`);
    }
  }
}
