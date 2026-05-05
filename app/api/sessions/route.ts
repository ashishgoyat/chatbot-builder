import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import nodemailer from "nodemailer";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getIP, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});


export async function POST(req: NextRequest) {
    const supabase = await createClient();
    try{
        // 10 session creations per hour per IP
        const ip = getIP(req)
        const { allowed, retryAfter } = checkRateLimit(`session:${ip}`, 5, 60 * 60_000)
        if (!allowed) return rateLimitResponse(retryAfter)

        const {chatbotId} = await req.json()
        if(!chatbotId) return NextResponse.json({error : "Chatbot Id not found"},{status : 400})

        const { data: result, error: claimError } = await supabase
            .rpc('try_claim_session', { p_chatbot_id: chatbotId });

        if (claimError || !result) return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });

        if (!result.claimed) {
            const adminClient = createAdminClient();
            const { data: userData } = await adminClient.auth.admin.getUserById(result.user_id);
            const ownerEmail = userData?.user?.email;

            if (ownerEmail) {
                await transporter.sendMail({
                    from: `BotForge <${process.env.GMAIL_USER}>`,
                    to: ownerEmail,
                    subject: 'Session limit reached for your chatbot',
                    html: `<p>Hi,</p>
                           <p>Your chatbot <strong>${result.name}</strong> has reached its session limit. No new visitor sessions can be created.</p>
                           <p>Thanks for Using.</p>
                           <p>— The BotForge Team</p>`,
                });
            }

            return NextResponse.json({ error: 'Session limit reached. No more sessions can be created for this chatbot.' }, { status: 403 });
        }

        const { data: sessionData, error: sessionError } = await supabase.from('sessions').insert({
            chatbot_id: chatbotId,
        }).select().single();

        if (sessionError) return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });

        const sessionId = sessionData.id;

        return NextResponse.json({success: true, sessionId});
    } catch (err: any){
        logger.error("POST /api/sessions failed", err);
        return NextResponse.json({error: "Error while creating session"}, {status: 500});
    }
}