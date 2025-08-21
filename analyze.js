import fetch from 'node-fetch';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { text } = req.body;
    try {
        const response = await fetch('https://api.kimi.ai/v1/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-bhRqYmOYjyAtHdOwNMOl07MchX3ViEUSUl5057keOV0lkpNb'
            },
            body: JSON.stringify({
                model: 'kimi-large',
                prompt: `请分析以下日程并给出建议:\n${text}`,
                max_tokens: 200
            })
        });
        const result = await response.json();
        res.status(200).json({ result: result.choices?.[0]?.text || '无返回结果' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ result: '分析失败' });
    }
}
