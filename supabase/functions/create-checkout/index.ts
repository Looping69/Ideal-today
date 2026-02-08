

export { }

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders
        })
    }

    try {
        const { amount, currency = 'ZAR', metadata, successUrl, cancelUrl, failUrl } = await req.json()

        // Retrieve the secret key from environment variables
        const secretKey = Deno.env.get('YOCO_SECRET_KEY')
        if (!secretKey) {
            console.error('YOCO_SECRET_KEY is not set')
            throw new Error('Server misconfiguration: Missing Payment Key')
        }

        const payload = {
            amount,
            currency,
            metadata,
            success_url: successUrl,
            cancel_url: cancelUrl,
            failure_url: failUrl
        }

        console.log('Creating checkout with:', payload)

        const response = await fetch('https://payments.yoco.com/api/checkouts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secretKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Yoco API Error:', data)
            throw new Error(data.message || 'Failed to create checkout')
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error: any) {
        console.error('Error handling request:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
