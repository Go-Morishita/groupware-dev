import {NextResponse} from "next/server";
import {createClient} from "@/app/lib/utils/supabase/server";
import {auth} from "@/app/lib/auth";

// GET: クエリパラメータで assigner_id を受け取り、該当のタスクを取得
export async function GET(request: Request) {
    try {
        const {searchParams} = new URL(request.url);
        const assignerId = searchParams.get("assigner_id");

        const supabase = await createClient();
        let query = supabase.from("tasks").select('*');
        if (assignerId) {
            query = query.eq("assigner_id", Number(assignerId));
        }
        const {data, error} = await query;

        if (error) {
            return NextResponse.json({error: error.message}, {status: 500});
        }
        return NextResponse.json(data);
    } catch (err: unknown) {
        let message = "Unknown error";
        if (err instanceof Error) {
            message = err.message;
        }
        return NextResponse.json({error: message}, {status: 500});
    }
}

// POST: action によって、タスクの追加または進捗更新を行う
export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // NextAuth.js でセッションを取得
        const session = await auth();
        if (!session?.user?.email) {
            console.error("Task POST Auth Error: No session or email found.");
            return NextResponse.json({error: "認証が必要です "}, {status: 400});
        }
        const managerEmail = session.user.email;

        // email を使って users テーブルからマネージャーIDを取得
        const {data: managerData, error: managerError} = await supabase
            .from("users")
            .select('id')
            .eq("email", managerEmail)
            .single();

        if (managerError || !managerData) {
            console.error(`Task POST User Error: Manager not found in DB for email ${managerEmail}:`, managerError);
            return NextResponse.json({error: `操作を行うユーザーデータが見つかりません。`}, {status: 404});
        }
        const managerId = managerData.id;   // 操作を行っているマネージャーのID

        // リクエストボディ取得
        const body = await request.json();
        const {action} = body;

        // -- タスク追加処理 --
        if (action === "add") {
            const {title, description, deadline, assigner_id} = body;
            // バリデーション強化
            if (!title?.trim() || !description?.trim() || !deadline || !assigner_id) {
                return NextResponse.json(
                    {error: "タイトル、説明、期限、担当者は必須です。"},
                    {status: 400}
                );
            }
            if (typeof assigner_id !== "number") {
                return NextResponse.json({error: "担当者IDが無効です。"}, {status: 400});
            }

            const {data: insertedData, error: insertError} = await supabase
                .from("tasks")
                .insert({
                    title: title.trim(),
                    description: description.trim(),
                    deadline: deadline,
                    manager_id: managerId,
                    assigner_id: assigner_id,
                    progress: 0, // 初期値
                    status: "未着手", // 例： status の初期値設定
                })
                .select()
                .single();

            if (insertError) {
                console.error("API Task Inset Error", insertError);
                return NextResponse.json({error: `タスク追加に失敗しました: ${insertError.message}`}, {status: 500});
            }
            return NextResponse.json({message: "タスクが正常に追加されました", insertedData});
        } else if (action === "updateProgress") {
            // 複数のタスク進捗更新処理
            const {updates} = body; // 例: [{ id: 1, progress: 50 }, { id: 2, progress: 80 }]
            if (!Array.isArray(updates)) {
                return NextResponse.json(
                    {error: "updates フィールドは配列である必要があります"},
                    {status: 400}
                );
            }
            const updatePromises = updates.map((task: { id: number; progress: number }) =>
                supabase.from("tasks").update({progress: task.progress}).eq("id", task.id)
            );
            const results = await Promise.all(updatePromises);
            for (const result of results) {
                if (result.error) {
                    return NextResponse.json({error: result.error.message}, {status: 500});
                }
            }
            return NextResponse.json({message: "進捗が正常に更新されました"});
        } else {
            return NextResponse.json({error: "無効な action です"}, {status: 400});
        }
    } catch (err: unknown) {
        let message = "Unknown error";
        if (err instanceof Error) {
            message = err.message;
        }
        return NextResponse.json({error: message}, {status: 500});
    }
}