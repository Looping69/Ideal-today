
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
        if (!secretKey) {
            console.error('YOCO_SECRET_KEY is not set')
            return new Response(JSON.stringify({
                error: 'Server misconfiguration: Payment Key missing',
                details: 'The YOCO_SECRET_KEY environment variable is not defined in Supabase secrets.'
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
        const response = await fetch('https://online.yoco.com/v1/checkouts', {
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
