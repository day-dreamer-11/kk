// analyze.js
import openai from 'openai';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!GROQ_API_KEY) {
        console.error('GROQ_API_KEY is not set in environment variables.');
        return res.status(500).json({ analysis: '服务器配置错误：API密钥未设置。' });
    }

    const text = req.body.text || req.body.data;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    try {
        const client = new openai.OpenAI({
            apiKey: GROQ_API_KEY,
            baseURL: 'https://api.groq.com/openai/v1'
        } );

        const response = await client.chat.completions.create({
            model: 'llama3-8b-8192',
            messages: [
                {
                    role: 'system',
                    content: "You are an AI assistant that analyzes schedules and provides suggestions. Please analyze the following schedule and give advice in Chinese."
                },
                {
                    role: 'user',
                    content: `请分析以下日程并给出建议:\n${text}`
                }
            ],
            max_tokens: 200,
            temperature: 0.7
        });

        // --- 调试日志 1: 打印完整的API响应 ---
        console.log('Full API Response from Groq:', JSON.stringify(response, null, 2));

        const analysis = response.choices[0]?.message?.content || '（AI没有返回有效内容）';

        // --- 调试日志 2: 打印最终提取出的内容 ---
        console.log('Extracted analysis content:', analysis);

        res.status(200).json({ analysis: analysis });

    } catch (err) {
        console.error('Server-side error:', err);
        res.status(500).json({ analysis: `分析失败: ${err.message}` });
    }
}
