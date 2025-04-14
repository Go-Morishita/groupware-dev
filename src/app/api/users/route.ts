import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/utils/supabase/client";

export async function POST(request: Request) {
    try {
        const { name, email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required." }, { status: 400 });
        }

        const supabase = createClient();

        // 既存ユーザーの存在チェック
        const { data, error } = await supabase
            .from("users")
            .select('*')
            .eq("email", email)
            .maybeSingle();

        // ユーザーが存在しない場合は新規登録する
        if (!data && !error) {
            const { error: insertError } = await supabase
                .from("users")
                .insert({
                    name,
                    email,
                });

            if (insertError) {
                return NextResponse.json({ error: insertError.message }, { status: 500 });
            }
            return NextResponse.json({ message: "User registered successfully" });
        }
        return NextResponse.json({ message: "User already exists" });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }

}