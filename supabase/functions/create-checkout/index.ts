
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
        const body = await req.json()
        const { amount, currency = 'ZAR', metadata, successUrl, cancelUrl } = body

        // Retrieve the secret key from environment variables
        const secretKey = Deno.env.get('YOCO_SECRET_KEY')
        console.log('YOCO_SECRET_KEY presence check:', secretKey ? 'Set (starts with ' + secretKey.substring(0, 3) + ')' : 'Not Set')

        if (!secretKey) {
            console.error('YOCO_SECRET_KEY is not set')
            return new Response(JSON.stringify({
                error: 'Server misconfiguration: Payment Key missing',
                details: 'The YOCO_SECRET_KEY environment variable is not defined in Supabase secrets. Please run: supabase secrets set YOCO_SECRET_KEY=sk_test_...'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            })
        }

        if (secretKey.startsWith('pk_')) {
            console.error('YOCO_SECRET_KEY appears to be a PUBLIC key (starts with pk_). It must be a SECRET key (starts with sk_).')
            return new Response(JSON.stringify({
                error: 'Server misconfiguration: Invalid Payment Key Type',
                details: 'A Public Key (pk_...) was provided instead of a Secret Key (sk_...). Please use your Yoco Secret Key.'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            })
        }

        // According to Yoco Online API documentation, fields are camelCase
        const payload = {
            amount,
            currency,
            metadata,
            successUrl: successUrl,
            cancelUrl: cancelUrl
        }

        console.log('Creating Yoco checkout with:', JSON.stringify(payload))

        // Using the documented V1 checkout endpoint
        // Including both Bearer and X-Auth-Secret-Key to maximize compatibility with Yoco v1
        const response = await fetch('https://online.yoco.com/v1/checkouts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secretKey}`,
                'X-Auth-Secret-Key': secretKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        let data;
        const text = await response.text();
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = { rawResponse: text };
        }

        console.log(`Yoco API response (${response.status}):`, JSON.stringify(data))

        if (!response.ok) {
            console.error('Yoco API Error:', data)
            return new Response(JSON.stringify({
                error: 'Payment provider error',
                details: data,
                message: data.message || 'Failed to create checkout'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: response.status,
            })
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error: any) {
        console.error('Error handling request:', error.message)
        return new Response(JSON.stringify({
            error: 'Internal service error',
            details: error.message
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
