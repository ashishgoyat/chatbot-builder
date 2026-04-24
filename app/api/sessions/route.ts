import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import nodemailer from "nodemailer";
import { NextRequest, NextResponse } from "next/server";

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
        const {chatbotId} = await req.json()
        if(!chatbotId) return NextResponse.json({error : "Chatbot Id not found"},{status : 400})
        const user_agent = req.headers.get('user-agent') ?? null
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? null

        const { data: chatbot, error: chatbotError } = await supabase
            .from('chatbots')
            .select('sessions, user_id, name')
            .eq('id', chatbotId)
            .single();

        if (chatbotError || !chatbot) return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });

        if (chatbot.sessions <= 0) {
            const adminClient = createAdminClient();
            const { data: userData } = await adminClient.auth.admin.getUserById(chatbot.user_id);
            const ownerEmail = userData?.user?.email;

            if (ownerEmail) {
                await transporter.sendMail({
                    from: `BotForge <${process.env.GMAIL_USER}>`,
                    to: ownerEmail,
                    subject: 'Session limit reached for your chatbot',
                    html: `<p>Hi,</p>
                           <p>Your chatbot <strong>${chatbot.name}</strong> has reached its session limit. No new visitor sessions can be created.</p>
                           <p>Please upgrade your plan or increase the session limit from your dashboard.</p>
                           <p>— The BotForge Team</p>`,
                });
            }

            return NextResponse.json({ error: 'Session limit reached. No more sessions can be created for this chatbot.' }, { status: 403 });
        }

        const { data: sessionData, error: sessionError } = await supabase.from('sessions').insert({
            chatbot_id: chatbotId,
            user_agent,
            ip_address: ip
        }).select().single();

        if (sessionError) return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });

        const { error: decrementError } = await supabase
            .from('chatbots')
            .update({ sessions: chatbot.sessions - 1 })
            .eq('id', chatbotId);

        if (decrementError) console.error('Failed to decrement session count:', decrementError);

        const sessionId = sessionData.id;

        return NextResponse.json({success: true, sessionId});
    } catch (err: any){
        console.error("Error while creating the session Id: ", err);
        return NextResponse.json({error: "Error while creating session"}, {status: 500});
    }
}