const https = require('https');

const requestJson = (url, body) => new Promise((resolve, reject) => {
    const request = https.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, response => {
        let data = '';
        response.on('data', chunk => { data += chunk; });
        response.on('end', () => {
            let parsed;
            try {
                parsed = JSON.parse(data);
            } catch (error) {
                reject(new Error('AI provider returned invalid JSON'));
                return;
            }
            if (response.statusCode < 200 || response.statusCode >= 300) {
                reject(new Error(parsed.error?.message || `AI provider returned ${response.statusCode}`));
                return;
            }
            resolve(parsed);
        });
    });
    request.on('error', reject);
    request.setTimeout(8000, () => request.destroy(new Error('AI provider request timed out')));
    request.write(JSON.stringify(body));
    request.end();
});

const getAllocationReasoning = async ({ emergency, requirements, candidates }) => {
    if ((process.env.AI_PROVIDER || 'none').toLowerCase() !== 'gemini' || !process.env.AI_API_KEY) {
        return null;
    }

    const model = process.env.AI_MODEL || 'gemini-2.5-flash-lite';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.AI_API_KEY)}`;
    const prompt = [
        'You are an emergency allocation reasoning assistant.',
        'Use only supplied facts. Do not invent live availability or medical facts.',
        'The deterministic engine remains authoritative for eligibility, route, and reservations.',
        'Return JSON with keys: summary (string), considerations (array of strings), confidence (number 0..1).',
        JSON.stringify({
            emergency: { type: emergency.type, subtype: emergency.subtype, severity: emergency.severity, symptoms: emergency.symptoms, location: emergency.location },
            requirements,
            candidates: candidates.map(candidate => ({ name: candidate.name, score: candidate.score, eligible: candidate.eligible, distance: candidate.distance, travelTime: candidate.travelTime, reasons: candidate.reasons, failedChecks: candidate.failedChecks }))
        })
    ].join('\n');

    const response = await requestJson(endpoint, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
    });
    const text = response.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '';
    const parsed = JSON.parse(text);
    return {
        summary: typeof parsed.summary === 'string' ? parsed.summary : '',
        considerations: Array.isArray(parsed.considerations) ? parsed.considerations.filter(Boolean) : [],
        confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0))
    };
};

module.exports = {
    getAllocationReasoning: async input => {
        try {
            return await getAllocationReasoning(input);
        } catch (error) {
            console.warn(`Optional AI reasoning unavailable; using local allocation reasoning: ${error.message}`);
            return null;
        }
    }
};
