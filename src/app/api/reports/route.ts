import {NextResponse} from "next/server";
import {createClient} from "@/app/lib/utils/supabase/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        console.log(searchParams);
        const supabase = await createClient();

        // selectクエリで関連テーブルのデータを結合して取得
        // reportsテーブルの全カラム (*)
        // reports.task_id に紐づく tasks テーブルの指定カラム (title, description, deadline, assigner_id)
        // tasks.assigner_id に紐づく users テーブルの指定カラム (name)
        const {data, error} = await supabase
            .from("reports")
            .select(`
                *,
                tasks (
                    id,
                    title,
                    description,
                    deadline,
                    assigner_id,
                    users ( name )
                )
            `)
            // 必要に応じて並び順を指定（例: reportの作成日時降順、進捗度順）
            .order('created_at', {ascending: false});
            // .order('progress', {ascending: false});

        if (error) {
            console.error("Supabase query error:", error); // エラー詳細をログ出力
            // 外部キー制約がない場合などのエラーメッセージを具体的に返すことも検討
            return NextResponse.json({error: `Failed to fetch reports with related data: ${error.message}`}, {status: 500});
        }

        // 取得したデータをそのまま返す (構造はネストされる)
        return NextResponse.json(data);

    } catch (err: unknown) {
        console.error("API route error:", err); // 予期せぬエラーをログ出力
        let message = "Unknown error occurred while fetching reports.";
        if (err instanceof Error) {
            message = err.message;
        }
        return NextResponse.json({error: message}, {status: 500});
    }
}

// DELETE メソッドハンドラ
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        // --- 一括削除処理 ---
        if (body.reportIds && Array.isArray(body.reportIds)) {
            const reportIdsToDelete: number[] = body.reportIds;
            if (reportIdsToDelete.length === 0) {
                return NextResponse.json({ message: "No report IDs provided for deletion." }, { status: 400 });
            }

            console.log("Attempting to bulk delete reports:", reportIdsToDelete);
            const { error: bulkDeleteError } = await supabase
                .from('reports')
                .delete()
                .in('id', reportIdsToDelete);

            if (bulkDeleteError) {
                console.error("Supabase bulk delete error:", bulkDeleteError);
                return NextResponse.json({ error: `Failed to delete reports: ${bulkDeleteError.message}` }, { status: 500 });
            }

            return NextResponse.json({ message: `${reportIdsToDelete.length} reports deleted successfully.` });
        }
        // --- 確認完了処理 (レポート & タスク削除) ---
        else if (body.action === 'confirmComplete' && body.reportId && body.taskId) {
            const { reportId, taskId } = body;
            console.log(`Attempting to confirm completion: delete report ${reportId} and task ${taskId}`);

            // 1. レポートを削除
            const { error: reportDeleteError } = await supabase
                .from('reports')
                .delete()
                .eq('id', reportId);

            if (reportDeleteError) {
                console.error("Supabase report delete error (confirm):", reportDeleteError);
                // タスク削除前にエラーが発生した場合
                return NextResponse.json({ error: `Failed to delete report ${reportId}: ${reportDeleteError.message}` }, { status: 500 });
            }
            console.log(`Report ${reportId} deleted successfully.`);

            // 2. タスクを削除
            const { error: taskDeleteError } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (taskDeleteError) {
                console.error("Supabase task delete error (confirm):", taskDeleteError);
                // レポートは削除されたがタスク削除でエラーが発生した場合
                // ここでのエラーハンドリングは重要（例: ログに記録、部分成功のメッセージを返すなど）
                return NextResponse.json({ error: `Report ${reportId} deleted, but failed to delete task ${taskId}: ${taskDeleteError.message}` }, { status: 500 });
            }
            console.log(`Task ${taskId} deleted successfully.`);

            return NextResponse.json({ message: `Completion confirmed for report ${reportId} and task ${taskId} (both deleted).` });
        }
        // --- 不明なリクエスト ---
        else {
            return NextResponse.json({ error: "Invalid request body for DELETE operation." }, { status: 400 });
        }

    } catch (err: unknown) {
        console.error("API route DELETE error:", err);
        let message = "Unknown error occurred during delete operation.";
        if (err instanceof Error) {
            message = err.message;
        }
        return NextResponse.json({ error: message }, { status: 500 });
    }
}