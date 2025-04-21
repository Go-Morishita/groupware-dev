import {useCallback, useEffect, useState} from "react";
import {
    UserIcon,
    CalendarDaysIcon,
    ChatBubbleLeftEllipsisIcon,
    DocumentTextIcon,
    ClockIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    TrashIcon, // 削除アイコン
    CheckCircleIcon, // 確認アイコン
    ExclamationTriangleIcon // エラーアイコン
} from '@heroicons/react/24/outline';

const ReportComponent: React.FC<SessionProps> = () => {
    const [reports, setReports] = useState<ReportWithDetails[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
    const [selectedToDelete, setSelectedToDelete] = useState<Set<number>>(new Set());   // 削除対象の report ID
    const [isDeleting, setIsDeleting] = useState(false);    // 削除処理中のローディング
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const getReports = useCallback(async () => {
        setLoading(true);
        setError(null);
        setDeleteError(null);
        try {
            const res = await fetch(`api/reports`);
            if (!res.ok) {
                throw new Error(`Failed to fetch reports: ${res.status} ${res.statusText}`);
            }
            const data: ReportWithDetails[] = await res.json();
            // task_id を tasks オブジェクト内にも id として含める（API側で対応するのが望ましい）
            const reportsWithTaskId = data.map(r => ({
                ...r,
                tasks: r.tasks ? {...r.tasks, id: r.task_id} : null
            }));
            setReports(reportsWithTaskId);
            console.log("Fetched reports with details: ", data);
            // 削除後に再フェッチされたら選択状態をリセット
            setSelectedToDelete(new Set());
            setSelectedReportId(null);
        } catch (err) {
            console.error("Error fetching reports: ", err);
            setError(err instanceof Error ? err.message : "An unknown error occured.");
        } finally {
            setLoading(false);
        }
    }, []); // 依存配列は空

    useEffect(() => {
        getReports();
    }, [getReports]);

    // 日付フォーマット関数（例）
    const formatDate = (dateString: string | undefined | null): string => {
        if (!dateString) return '-';
        try {
            // より柔軟な日付表示が必要な場合は date-fns や dayjs などのライブラリを検討
            return new Date(dateString).toLocaleDateString('ja-JP'); // 日本語ロケールで表示
        } catch (e) {
            console.error("Date formatting error:", e);
            return dateString; // パース失敗時は元の文字列を返す
        }
    };

    // リストアイテムクリック時のハンドラ (名前をItemに)
    const handleItemClick = (reportId: number) => {
        setSelectedReportId(prevId => (prevId === reportId ? null : reportId));
    };

    // チェックボックス変更ハンドラ
    const handleCheckboxChange = (reportId: number) => {
        setSelectedToDelete(prevSet => {
            const newSet = new Set(prevSet); // 現在のSetをコピー
            if (newSet.has(reportId)) {
                newSet.delete(reportId); // 既に含まれていれば削除
            } else {
                newSet.add(reportId); // なければ追加
            }
            return newSet;
        });
    };

    // 一括削除ハンドラ
    const handleBulkDelete = async () => {
        if (selectedToDelete.size === 0) return;
        if (!window.confirm(`${selectedToDelete.size}件のレポートを削除してもよろしいですか？この操作は元に戻せません。`)) return;

        setIsDeleting(true);
        setDeleteError(null);
        try {
            const reportIdsToDelete = Array.from(selectedToDelete); // Setを配列に変換
            const res = await fetch(`/api/reports`, {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({reportIds: reportIdsToDelete}), // 削除対象IDをボディで送信
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({error: "Unknown error occurred during deletion."}));
                throw new Error(errorData.error || `Failed to delete reports: ${res.status}`);
            }

            console.log("Successfully deleted reports:", reportIdsToDelete);
            // 成功したらリストを再読み込み
            await getReports();

        } catch (err) {
            console.error("Error deleting reports:", err);
            setDeleteError(err instanceof Error ? err.message : "An unknown error occurred during deletion.");
        } finally {
            setIsDeleting(false);
        }
    };

    // 確認/完了ハンドラ (レポート & タスク削除)
    const handleConfirmComplete = async (reportId: number, taskId: number | undefined) => {
        if (taskId === undefined) {
            setDeleteError("Cannot complete: Task ID is missing.");
            return;
        }
        if (!window.confirm(`タスク「${reports.find(r => r.id === reportId)?.tasks?.title ?? 'N/A'}」を完了済としてアーカイブ（レポートとタスクを削除）しますか？この操作は元に戻せません。`)) return;

        setIsDeleting(true);
        setDeleteError(null);
        try {
            const res = await fetch(`/api/reports`, { // 同じエンドポイントを使用
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'confirmComplete', reportId: reportId, taskId: taskId }), // actionを追加して区別
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: "Unknown error occurred during completion." }));
                throw new Error(errorData.error || `Failed to confirm completion: ${res.status}`);
            }

            console.log("Successfully confirmed completion for report:", reportId, "task:", taskId);
            // 成功したらリストを再読み込み
            await getReports();

        } catch (err) {
            console.error("Error confirming completion:", err);
            setDeleteError(err instanceof Error ? err.message : "An unknown error occurred during completion.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading && reports.length === 0) {
        return <div className="text-center p-8">Loading reports...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-600">Error: {error}</div>;
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
            {/* ヘッダーエリア: タイトルと一括削除ボタン (変更なし) */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Task Reports List</h2>
                {selectedToDelete.size > 0 && ( <button onClick={handleBulkDelete} disabled={isDeleting} className={`px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}> <TrashIcon className="w-4 h-4 mr-2"/> {isDeleting ? 'Deleting...' : `Delete Selected (${selectedToDelete.size})`} </button> )}
            </div>
            {/* 削除エラーメッセージ表示 (変更なし) */}
            {deleteError && ( <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center"> <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0"/> <span>{deleteError}</span> <button onClick={() => setDeleteError(null)} className="ml-auto text-red-700 hover:text-red-900 text-xl font-bold">&times;</button> </div> )}


            {reports.length === 0 && !loading ? (
                <p className="text-center text-gray-500">No reports found.</p>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul role="list" className="divide-y divide-gray-200">
                        {reports.map((report) => {
                            const isCompleted = report.progress === 100;
                            const isSelected = selectedReportId === report.id;
                            const progressDiff = report.progress - report.pre_progress;
                            const isChecked = selectedToDelete.has(report.id);

                            return (
                                <li key={report.id} className={`${isCompleted ? 'bg-green-50' : ''} ${isDeleting && isChecked ? 'opacity-50' : ''}`}>
                                    {/* --- レイアウト構造を変更 --- */}
                                    <div className="flex items-start sm:items-center px-4 py-4 sm:px-6">
                                        {/* チェックボックス表示領域 (常にレンダリング) */}
                                        <div className="flex-shrink-0 mr-3 w-4 h-4"> {/* 幅と高さを指定してスペース確保 */}
                                            <input
                                                type="checkbox"
                                                className={`
                                                    h-full w-full text-indigo-600 border-gray-300 rounded focus:ring-indigo-500
                                                    ${isCompleted ? 'opacity-0 pointer-events-none' : 'cursor-pointer'} {/* 完了時は非表示＆操作不可 */}
                                                `}
                                                checked={isChecked}
                                                onChange={(e) => {
                                                    if (isCompleted) return; // 隠れたチェックボックスは操作しない
                                                    e.stopPropagation();
                                                    handleCheckboxChange(report.id);
                                                }}
                                                disabled={isDeleting || isCompleted}
                                            />
                                        </div>

                                        {/* メインコンテンツ (ボーダーと左パディングをここに適用) */}
                                        <div
                                            onClick={() => !isDeleting && handleItemClick(report.id)}
                                            className={`
                                                flex-grow flex flex-col sm:flex-row sm:items-center sm:justify-between
                                                border-l-4 ${isCompleted ? 'border-green-500' : 'border-blue-500'}
                                                pl-3 {/* ボーダーの左側にパディング */}
                                                ${!isDeleting ? 'cursor-pointer hover:bg-gray-100 transition duration-150 ease-in-out' : ''}
                                            `}
                                        >
                                            {/* 左側: タイトルと担当者/期限 */}
                                            <div className="flex-grow mb-3 sm:mb-0">
                                                <p className="text-base font-semibold text-indigo-600 truncate" title={report.tasks?.title ?? ''}>
                                                    {report.tasks?.title ?? 'No Title'}
                                                </p>
                                                <div className="mt-1 flex items-center text-sm text-gray-500 space-x-3">
                                                    <span className="flex items-center" title="Assigner">
                                                        <UserIcon className="w-4 h-4 mr-1"/> {report.tasks?.users?.name ?? 'N/A'}
                                                    </span>
                                                    <span className="flex items-center" title="Deadline">
                                                        <CalendarDaysIcon className="w-4 h-4 mr-1"/> {formatDate(report.tasks?.deadline)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* 右側: 進捗と展開アイコン */}
                                            <div className="flex items-center flex-shrink-0 sm:ml-4">
                                                <div className="text-right mr-4">
                                                    <span className={`text-sm font-bold ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                                                        {report.pre_progress}% → {report.progress}%
                                                        {progressDiff > 0 && (<span className="text-green-600 ml-1">(+{progressDiff}%)</span>)}
                                                        {progressDiff < 0 && (<span className="text-red-600 ml-1">({progressDiff}%)</span>)}
                                                    </span>
                                                    <div className="w-24 mt-1 bg-gray-200 rounded-full h-2 overflow-hidden relative">
                                                        <div className="bg-blue-300 h-2 rounded-full absolute" style={{ width: `${report.pre_progress}%`, zIndex: 1 }}></div>
                                                        <div className={`${isCompleted ? 'bg-green-500' : 'bg-blue-600'} h-2 rounded-full absolute transition-width duration-500 ease-in-out`} style={{ width: `${report.progress}%`, zIndex: 2 }}></div>
                                                    </div>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    {isSelected ? (<ChevronUpIcon className="w-5 h-5 text-gray-400" />) : (<ChevronDownIcon className="w-5 h-5 text-gray-400" />)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* --- ここまでレイアウト構造の変更 --- */}

                                    {/* 詳細セクション (変更なし) */}
                                    {isSelected && (
                                        <div className={`px-4 py-4 sm:px-10 border-t border-gray-200 ${isCompleted ? 'bg-green-50' : 'bg-gray-50'}`}>
                                            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-3 mb-4">
                                                <div className="sm:col-span-1"> <dt className="text-sm font-medium text-gray-500 flex items-center mb-1"><DocumentTextIcon className="w-4 h-4 mr-1"/> タスクの詳細</dt> <dd className="text-sm text-gray-900 break-words">{report.tasks?.description ?? 'N/A'}</dd> </div>
                                                <div className="sm:col-span-1"> <dt className="text-sm font-medium text-gray-500 flex items-center mb-1"><ChatBubbleLeftEllipsisIcon className="w-4 h-4 mr-1"/> コメント</dt> <dd className="text-sm text-gray-900 italic">{report.comment || 'No comment'}</dd> </div>
                                                <div className="sm:col-span-1"> <dt className="text-sm font-medium text-gray-500 flex items-center mb-1"><ClockIcon className="w-4 h-4 mr-1"/> 更新日</dt> <dd className="text-sm text-gray-900">{formatDate(report.created_at)}</dd> </div>
                                            </dl>
                                            {isCompleted && ( <div className="flex justify-end pt-3 border-t border-gray-300"> <button onClick={(e) => { e.stopPropagation(); handleConfirmComplete(report.id, report.tasks?.id); }} disabled={isDeleting} className={`px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}> <CheckCircleIcon className="w-4 h-4 mr-1.5"/> {isDeleting ? 'Processing...' : '確認完了 (Archive)'} </button> </div> )}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                    {loading && reports.length > 0 && ( <div className="text-center p-4 text-gray-500">Updating list...</div> )}
                </div>
            )}
        </div>
    );
}

export default ReportComponent;