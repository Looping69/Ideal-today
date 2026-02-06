

export { }

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "https://idealtoday.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email templates for different auth actions
const emailTemplates = {
    signup: (email: string, token: string, siteUrl: string) => ({
        subject: "Welcome to Ideal Stay! Confirm your email",
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 40px;">
                    <h1 style="color: #1a1a1a; margin: 0; font-size: 28px;">Welcome to Ideal Stay!</h1>
                </div>
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
                    <p style="color: white; font-size: 18px; margin: 0 0 20px 0;">You're just one click away from amazing stays.</p>
                    <a href="${siteUrl}/auth/confirm?token_hash=${token}&type=signup" 
                       style="display: inline-block; background: white; color: #667eea; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Confirm Email
                    </a>
                </div>
                <p style="color: #666; font-size: 14px; text-align: center;">
                    If you didn't create an account, you can safely ignore this email.
                </p>
            </div>
        `,
    }),
    recovery: (email: string, token: string, siteUrl: string) => ({
        subject: "Reset your Ideal Stay password",
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <h1 style="color: #1a1a1a; text-align: center; margin-bottom: 30px;">Password Reset</h1>
                <p style="color: #666; text-align: center; margin-bottom: 30px;">
                    We received a request to reset your password. Click below to set a new one.
                </p>
                <div style="text-align: center; margin-bottom: 30px;">
                    <a href="${siteUrl}/auth/confirm?token_hash=${token}&type=recovery" 
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #999; font-size: 12px; text-align: center;">
                    If you didn't request this, you can safely ignore this email.
                </p>
            </div>
        `,
    }),
    magic_link: (email: string, token: string, siteUrl: string) => ({
        subject: "Your Ideal Stay login link",
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <h1 style="color: #1a1a1a; text-align: center; margin-bottom: 30px;">Login to Ideal Stay</h1>
                <div style="text-align: center; margin-bottom: 30px;">
                    <a href="${siteUrl}/auth/confirm?token_hash=${token}&type=magiclink" 
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Log In
                    </a>
                </div>
                <p style="color: #999; font-size: 12px; text-align: center;">
                    This link expires in 1 hour.
                </p>
            </div>
        `,
    }),
    email_change: (email: string, token: string, siteUrl: string) => ({
        subject: "Confirm your new email for Ideal Stay",
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <h1 style="color: #1a1a1a; text-align: center; margin-bottom: 30px;">Email Change Confirmation</h1>
                <p style="color: #666; text-align: center; margin-bottom: 30px;">
                    Click below to confirm your new email address.
                </p>
                <div style="text-align: center; margin-bottom: 30px;">
                    <a href="${siteUrl}/auth/confirm?token_hash=${token}&type=email_change" 
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Confirm Email
                    </a>
                </div>
            </div>
        `,
    }),
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload = await req.json();

        // Handle both direct calls and Auth Hook calls
        let to: string;
        let subject: string;
        let html: string;

        // Auth Hook format from Supabase
        if (payload.user && payload.email_data) {
            const { user, email_data } = payload;
            const email = user.email;
            const token = email_data.token_hash || email_data.token;
            const emailType = email_data.email_action_type || 'signup';
            const siteUrl = email_data.site_url || Deno.env.get("SITE_URL") || "http://localhost:5173";

            const template = emailTemplates[emailType as keyof typeof emailTemplates] || emailTemplates.signup;
            const emailContent = template(email, token, siteUrl);

            to = email;
            subject = emailContent.subject;
            html = emailContent.html;
        }
        // Direct call format
        else if (payload.to && payload.subject && payload.html) {
            to = payload.to;
            subject = payload.subject;
            html = payload.html;
        }
        else {
            throw new Error("Invalid payload format");
        }

        if (!RESEND_API_KEY) {
            throw new Error("Missing RESEND_API_KEY");
        }

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: Deno.env.get("SENDER_EMAIL") || "Ideal Stay <onboarding@resend.dev>",
                to: [to],
                subject: subject,
                html: html,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Resend API error:", data);
            throw new Error(data.message || "Failed to send email");
        }

        return new Response(JSON.stringify({ success: true, data }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error("Email function error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
