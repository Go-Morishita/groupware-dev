// import { NextResponse } from "next/server";
// import { createClient } from "@/app/lib/utils/supabase/server";
// import { nanoid } from "nanoid";

// // GET: クエリパラメータで assigner_id を受け取り、該当のタスクを取得
// export async function GET(request: Request) {
//     try {
//         const { searchParams } = new URL(request.url);
//         const assignerId = searchParams.get("assigner_id");

//         const supabase = await createClient();
//         let query = supabase.from("tasks").select('*');
//         if (assignerId) {
//             query = query.eq("assigner_id", Number(assignerId));
//         }
//         const { data, error } = await query;

//         if (error) {
//             return NextResponse.json({ error: error.message }, { status: 500 });
//         }
//         return NextResponse.json(data);
//     } catch (err: any) {
//         return NextResponse.json({ error: err.message }, { status: 500 });
//     }
// }

// // POST: action によって、タスクの追加または進捗更新を行う
// export async function POST(request: Request) {
//     try {
//         const body = await request.json();
//         const { action } = body;
//         const supabase = await createClient();

//         if (action == "add") {
//             // タスク追加処理
//             const { title, description, deadline, manager_id, assigner_id } = body;
//             if (!title || !description || !deadline || !assigner_id) {
//                 return NextResponse.json({ error: "必須のフィールドが不足しています" }, { status: 400 });
//             }
//             const { data, error } = await supabase.from("tasks").insert({
//                 title,
//                 description,
//                 deadline,
//                 manager_id: manager_id ?? null, // manager_id がない場合は null
//                 assigner_id,
//                 progress: 0, // 初期値
//             });
//             if (error) {
//                 return NextResponse.json({ error: error.message }, { status: 500 });
//             }
//             return NextResponse.json({ message: "タスクが正常に追加されました", data });
//         }
//     }
// }