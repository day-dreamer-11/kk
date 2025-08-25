import fetch from 'node-fetch';

// 使用您新生成的、未公开的Groq API密钥
// 为了安全，强烈建议将密钥存储在环境变量中，而不是硬编码在代码里
const GROQ_API_KEY = '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'; // <--- 已替换为您提供的密钥

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 从请求体中获取文本，兼容您前端代码的两种可能写法
    const text = req.body.text || req.body.data;

    if (!text) {
        return res.status(400).json({ error: 'Text is required in the request body' });
    }

    try {
        // 调用Groq的API
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 使用Groq的API密钥
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                // 使用Llama3模型
                model: 'llama3-8b-8192', 
                messages: [
                    {
                        role: 'system',
                        // 为Llama 3优化了系统指令 ，使用英文通常效果更好
                        content: "You are an AI assistant that analyzes schedules and provides suggestions. Please analyze the following schedule and give advice in Chinese."
                    },
                    {
                        role: 'user',
                        content: `请分析以下日程并给出建议:\n${text}`
                    }
                ],
                max_tokens: 200,
                temperature: 0.7 // 稍微增加一点创造性
            })
        });

        const result = await response.json();

        if (!response.ok) {
            // 如果API返回错误，将错误信息传递给前端
            console.error('Groq API Error:', result);
            throw new Error(result.error?.message || 'Groq API returned an error');
        }

        // 从返回结果中提取AI生成的内容
        const analysis = result.choices?.[0]?.message?.content || '无返回结果';
        
        // **【重要】** 确保返回的JSON key与前端期望的'analysis'匹配
        res.status(200).json({ analysis: analysis });

    } catch (err) {
        console.error('Server-side error:', err);
        res.status(500).json({ analysis: `分析失败: ${err.message}` });
    }
}
