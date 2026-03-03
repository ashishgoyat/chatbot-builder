import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    try {
        const supabase = await createClient()

        const { data, error } = await supabase.from('chatbots').select('name, color, welcome_message').eq('id', id).single()
        if (error || !data) {
            return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })
        }

        return NextResponse.json(data, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET" } })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { error } = await supabase
            .from('chatbots')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}