import fetch from 'node-fetch';

// 从Vercel的环境变量中安全地读取API密钥
const GROQ_API_KEY = process.env.GROQ_API_KEY;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 检查API密钥是否存在
    if (!GROQ_API_KEY) {
        console.error('GROQ_API_KEY is not set in environment variables.');
        return res.status(500).json({ analysis: '服务器配置错误：API密钥未设置。' });
    }

    const text = req.body.text || req.body.data;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
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
            } )
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Groq API Error:', result);
            throw new Error(result.error?.message || 'Groq API returned an error');
        }

        const analysis = result.choices?.[0]?.message?.content || '无返回结果';
        res.status(200).json({ analysis: analysis });

    } catch (err) {
        console.error('Server-side error:', err);
        res.status(500).json({ analysis: `分析失败: ${err.message}` });
    }
}
