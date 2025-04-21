// /app/api/my-tasks/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/utils/supabase/server"; // サーバー用クライアント
import { auth} from "@/app/lib/auth";

// GET: ログインユーザーに割り当てられたタスクを取得
export async function GET() {
    try {
        const supabase = await createClient();
        const session = await auth();

        if (!session?.user?.email) { // email がセッションに含まれているか確認
            console.error("Authentication error: No session or email found.");
            return NextResponse.json({ error: "認証が必要です。ユーザー情報が見つかりません。" }, { status: 401 });
        }

        const userEmail = session.user.email;

        // --- email を使って users テーブルからユーザーIDを取得 ---
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id') // usersテーブルの主キーカラム名を確認してください
            .eq('email', userEmail)
            .single(); // email はユニークなはず

        if (userError || !userData) {
            console.error(`User not found in DB for email ${userEmail}:`, userError);
            // ユーザーがDBに存在しない場合のエラーハンドリング
            return NextResponse.json({ error: `ユーザーデータが見つかりません (email: ${userEmail})。` }, { status: 404 });
        }
        const userId = userData.id;

        // ユーザーに割り当てられたタスクを取得 (userId を使用)
        const { data, error: taskError } = await supabase
            .from('tasks')
            .select('*')
            .eq('assigner_id', userId) // <<<--- 取得した userId を使用
            .order('deadline', { ascending: true });

        if (taskError) {
            console.error("Error fetching tasks:", taskError);
            throw taskError;
        }

        return NextResponse.json(data ?? []);

    } catch (err) {
        console.error("API route GET error:", err);
        let message = "タスクの取得中にエラーが発生しました。";
        if (err instanceof Error) { message = err.message; }
        return NextResponse.json({ error: message }, { status: 500 });
    }
}


// PATCH: タスクの進捗を更新し、レポートを追加
export async function PATCH(request: Request) {
    const supabase =　await createClient();

    try {
        const session = await auth();

        if (!session?.user?.email) { // email がセッションに含まれているか確認
            console.error("Authentication error: No session or email found.");
            return NextResponse.json({ error: "認証が必要です。ユーザー情報が見つかりません。" }, { status: 401 });
        }

        const userEmail = session.user.email;

        // --- email を使って users テーブルからユーザーIDを取得 ---
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', userEmail)
            .single();

        if (userError || !userData) {
            console.error(`User not found in DB for email ${userEmail}:`, userError);
            return NextResponse.json({ error: `ユーザーデータが見つかりません (email: ${userEmail})。` }, { status: 404 });
        }
        const userId = userData.id; // 認証されたユーザーのDB上のID

        // リクエストボディを解析
        const { taskId, newProgress, comment } = await request.json();
        if (!taskId || newProgress === undefined || !comment || !comment.trim()) { return NextResponse.json({ error: "タスクID、新しい進捗、コメントは必須です。" }, { status: 400 }); }
        if (typeof newProgress !== 'number' || newProgress < 0 || newProgress > 100) { return NextResponse.json({ error: "進捗は0から100の数値である必要があります。" }, { status: 400 }); }


        // 1. 更新対象のタスクを取得し、権限を確認＆更新前の進捗を取得
        const { data: originalTask, error: fetchError } = await supabase
            .from('tasks')
            .select('progress, assigner_id')
            .eq('id', taskId)
            .single();

        // ... (タスク取得エラーハンドリングは変更なし) ...
        if (fetchError) { console.error("Error fetching original task:", fetchError); if (fetchError.code === 'PGRST116') { return NextResponse.json({ error: `タスク (ID: ${taskId}) が見つかりません。` }, { status: 404 }); } return NextResponse.json({ error: "タスク情報の取得に失敗しました。" }, { status: 500 }); }

        // 権限チェック：タスクがログインユーザーに割り当てられているか？ (userId を使用)
        if (originalTask.assigner_id !== userId) { // <<<--- 取得した userId でチェック
            console.warn(`Authorization failed: User ${userId} (email: ${userEmail}) tried to update task ${taskId} assigned to ${originalTask.assigner_id}`);
            return NextResponse.json({ error: "このタスクを更新する権限がありません。" }, { status: 403 });
        }

        const preProgress = originalTask.progress;

        // 2. tasksテーブルを更新
        const { data: updatedTaskData, error: updateError } = await supabase
            .from('tasks')
            .update({ progress: newProgress })
            .eq('id', taskId)
            .select()
            .single();

        if (updateError) { console.error("Error updating task:", updateError); return NextResponse.json({ error: `タスクの更新に失敗しました: ${updateError.message}` }, { status: 500 }); }
        if (!updatedTaskData) { return NextResponse.json({ error: "更新後のタスクデータの取得に失敗しました。" }, { status: 500 }); }


        // 3. reportテーブルにアクティビティを追加
        const { error: reportError } = await supabase
            .from('reports')
            .insert({ task_id: taskId, pre_progress: preProgress, progress: newProgress, comment: comment });

        if (reportError) { console.warn(`Task ${taskId} updated, but failed to insert report:`, reportError); }

        // 成功レスポンス（更新後のタスクデータを返す）
        return NextResponse.json(updatedTaskData);

    } catch (err: unknown) {
        console.error("API route PATCH error:", err);
        let message = "タスクの更新中に予期せぬエラーが発生しました。";
        if (err instanceof SyntaxError) { message = "リクエスト形式が無効です。"; return NextResponse.json({ error: message }, { status: 400 }); }
        if (err instanceof Error) { message = err.message; }
        return NextResponse.json({ error: message }, { status: 500 });
    }
}