import { supabase } from "@/lib/supabase";

export const sendEmail = async (to: string, subject: string, html: string) => {

    try {
        const { data, error } = await supabase.functions.invoke('send-email', {
            body: { to, subject, html },
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error sending email:', error);
        // Fallback: Log to console in dev/if function fails
        console.log(`[EMAIL MOCK] To: ${to}, Subject: ${subject}`);
        return null;
    }
};
