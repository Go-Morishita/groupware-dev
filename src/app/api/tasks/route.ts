import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/utils/supabase/server";
import { nanoid } from "nanoid";

// GET: クエリパラメータで assigner_id を受け取り、該当のタスクを取得
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const assignerId = searchParams.get("assigner_id");

        const supabase = await createClient();
        let query = supabase.from("tasks").select('*');
        if (assignerId) {
            query = query.eq("assigner_id", Number(assignerId));
        }
        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST: action によって、タスクの追加または進捗更新を行う
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action } = body;
        const supabase = await createClient();

        if (action == "add") {
            // タスク追加処理
            const { title, description, deadline, manager_id, assigner_id } = body;
            if (!title || !description || !deadline || !assigner_id) {
                return NextResponse.json({ error: "必須のフィールドが不足しています" }, { status: 400 });
            }
            const { data, error } = await supabase.from("tasks").insert({
                title: title,
                description: description,
                deadline: deadline,
                manager_id: manager_id, 
                assigner_id: assigner_id,
                progress: 0, // 初期値
            });
            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            return NextResponse.json({ message: "タスクが正常に追加されました", data });
        } else if (action === "updateProgress") {
            // 複数のタスク進捗更新処理
            const { updates } = body; // 例: [{id: 1, progress: 50 }, { id: 2, progress: 80 }]
            if (!Array.isArray(updates)) {
                return NextResponse.json({ error: "updates フィールドは配列である必要があります" }, { status: 400 });
            }
            const updatePromises = updates.map((task: { id: number; progress: number }) =>
                supabase.from("tasks").update({ progress: task.progress }).eq("id", task.id)
            );
            const results = await Promise.all(updatePromises);
            for (const result of results) {
                if (result.error) {
                    return NextResponse.json({ error: result.error.message }, { status: 500 });
                }
            }
            return NextResponse.json({ message: "進捗が正常に更新されました" }, { status: 400 });
        } else {
            return NextResponse.json({ error: "無効な action です" }, { status: 400 });
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}