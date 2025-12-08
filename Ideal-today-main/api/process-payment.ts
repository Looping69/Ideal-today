import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    if (request.method === 'OPTIONS') {
        response.status(200).end();
        return;
    }

    if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { token, amountInCents, currency } = request.body;

        // Use environment variable or fallback to TEST secret key (only for dev/test)
        const secretKey = process.env.YOCO_SECRET_KEY || 'sk_test_e68dec05NokEB4Lb47e454790b34';

        if (!secretKey) {
            throw new Error('Missing YOCO_SECRET_KEY');
        }

        const result = await fetch("https://online.yoco.com/v1/charges/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Auth-Secret-Key": secretKey,
            },
            body: JSON.stringify({
                token,
                amountInCents,
                currency: currency || "ZAR",
            }),
        });

        const data = await result.json();

        if (!result.ok) {
            response.status(400).json(data);
        } else {
            response.status(200).json(data);
        }

    } catch (error: any) {
        console.error(error);
        response.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
