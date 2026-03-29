import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
    const supabase = await createClient();
    try{
        const {chatbotId} = await req.json()
        if(!chatbotId) return NextResponse.json({error : "Chatbot Id not found"},{status : 400})
        const user_agent = req.headers.get('user-agent') ?? null
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? null

        const {data: sessionData, error: sessionError} = await supabase.from('sessions').insert({
            chatbot_id: chatbotId,
            user_agent,
            ip_address: ip
        }).select().single();

        if(sessionError) return NextResponse.json({error: `Failed to create session`}, {status: 500});

        const sessionId = sessionData.id;

        return NextResponse.json({success: true, sessionId});
    } catch (err: any){
        console.error("Error while creating the session Id: ", err);
        return NextResponse.json({error: "Error while creating session"}, {status: 500});
    }
}