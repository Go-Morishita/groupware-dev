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
                    title,
                    description,
                    deadline,
                    assigner_id,
                    users ( name )
                )
            `)
            // 必要に応じて並び順を指定（例: reportの作成日時降順、進捗度順）
            // .order('created_at', {ascending: false});
            .order('progress', {ascending: false});

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