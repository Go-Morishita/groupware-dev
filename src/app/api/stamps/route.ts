import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/utils/supabase/server";
import { nanoid } from "nanoid";

export async function GET(request: Request) {
  try {
    // クエリパラメータから email を取得（例: /api/stamps?email=user@example.com)
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("stamps")
      .select("clock_in, clock_out")
      .eq("email", email)
      .order("clock_in", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { action, email, stamp_id } = await request.json();
    const supabase = await createClient();

    if (!action) {
      return NextResponse.json({ error: "action が指定されていません。" }, { status: 400 });
    }

    if (action === "clockIn") {
      if (!email) {
        return NextResponse.json({ error: "出勤処理には email が必要です。" }, { status: 400 });
      }
      // 出勤時に一意の stamp_id を生成
      const id = nanoid();
      const time = new Date().toISOString();

      const { error } = await supabase.from("stamps").insert({
        stamp_id: id,
        clock_in: time,
        email,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({
        message: "出勤処理が成功しました。",
        stamp_id: id,
      });
    } else if (action === "clockOut") {
      if (!stamp_id) {
        return NextResponse.json({ error: "退勤処理には stamp_id が必要です。" }, { status: 400 });
      }
      const time = new Date().toISOString();

      const { error } = await supabase.from("stamps").update({
        clock_out: time,
      }).eq("stamp_id", stamp_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({
        message: "退勤処理が成功しました。",
      });
    } else {
      return NextResponse.json({ error: "無効な action です。" }, { status: 400 });
    }
  } catch (err: unknown) {
    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}