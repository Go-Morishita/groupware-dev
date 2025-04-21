import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const { name, email, image } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const supabase = await createClient();

    // 既存ユーザーの存在チェック
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    // ユーザーが存在しない場合は新規登録する
    if (!data && !error) {
      const { error: insertError } = await supabase.from("users").insert({
        name,
        email,
        image,
      });

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      return NextResponse.json({ message: "User registered successfully" });
    }
    return NextResponse.json({ message: "User already exists" });
  } catch (err: unknown) {
    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const supabase = await createClient();

    if (email) {
      // email が指定されていれば、該当ユーザーの id を返す
      const { data, error } = await supabase
        .from("users")
        .select("id, role")
        .eq("email", email)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(data);
    } else {
      // email が指定されていなければ、ユーザー一覧を返す
      const { data, error } = await supabase.from("users").select("*");

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(data);
    }
  } catch (err: unknown) {
    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}