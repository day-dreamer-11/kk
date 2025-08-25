import openai from 'openai';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Vercel AI SDK 帮助我们轻松处理流式数据
// (我们不需要安装它，Vercel运行时内置了兼容能力)
export const config = {
  runtime: 'edge', // 使用更快的Edge运行时，非常适合流式处理
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!GROQ_API_KEY) {
    return new Response('Server config error: API Key not set.', { status: 500 });
  }

  try {
    const { text } = await req.json(); // 从请求体中获取text

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

    // 将AI返回的流直接转发给前端
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          controller.enqueue(new TextEncoder().encode(content));
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (err) {
    console.error(err);
    return new Response(`Analysis failed: ${err.message}`, { status: 500 });
  }
}
