import {useEffect, useState} from "react";
import {
    UserIcon,
    CalendarDaysIcon,
    ChatBubbleLeftEllipsisIcon,
    DocumentTextIcon,
    ClockIcon,
    ChevronDownIcon, // 詳細展開用アイコン
    ChevronUpIcon   // 詳細折りたたみ用アイコン
} from '@heroicons/react/24/outline';

const ReportComponent: React.FC<SessionProps> = () => {
    const [reports, setReports] = useState<ReportWithDetails[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

    const getReports = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`api/reports`);
            if(!res.ok) {
                throw new Error(`Failed to fetch reports: ${res.status} ${res.statusText}`);
            }
            const data: ReportWithDetails[] = await res.json();
            setReports(data);   // API側でソート済
            console.log("Fetched reports with details: ", data);
        } catch (err) {
            console.error("Error fetching reports: ", err);
            setError(err instanceof Error ? err.message : "An unknown error occured.");
        } finally {
            setLoading(false);
        }

    }

    useEffect(() => {
        getReports();
    }, [])

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

    if (loading) {
        return <div className="text-center p-8">Loading reports...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-600">Error: {error}</div>;
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Task Reports List</h2>
            {reports.length === 0 ? (
                <p className="text-center text-gray-500">No reports found.</p>
            ) : (
                // リスト全体のコンテナ
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul role="list" className="divide-y divide-gray-200"> {/* ulとliを使う場合 */}
                        {reports.map((report) => {
                            const isCompleted = report.progress === 100;
                            const isSelected = selectedReportId === report.id;
                            const progressDiff = report.progress - report.pre_progress;

                            return (
                                <li key={report.id}
                                    className={`${isCompleted ? 'bg-green-50' : ''}`}> {/* li要素を使用 */}
                                    {/* リストアイテムのメイン部分 */}
                                    <div
                                        onClick={() => handleItemClick(report.id)}
                                        className={`
                                            px-4 py-4 sm:px-6 cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between
                                            hover:bg-gray-100 transition duration-150 ease-in-out
                                            ${isCompleted ? 'border-l-4 border-green-500' : 'border-l-4 border-blue-500'}
                                        `}
                                    >
                                        {/* 左側: タイトルと担当者/期限 */}
                                        <div className="flex-grow mb-3 sm:mb-0">
                                            <p className="text-base font-semibold text-indigo-600 truncate"
                                               title={report.tasks?.title ?? ''}>
                                                {report.tasks?.title ?? 'No Title'}
                                            </p>
                                            <div className="mt-1 flex items-center text-sm text-gray-500 space-x-3">
                                                <span className="flex items-center" title="Assigner">
                                                    <UserIcon className="w-4 h-4 mr-1"/>
                                                    {report.tasks?.users?.name ?? 'N/A'}
                                                </span>
                                                <span className="flex items-center" title="Deadline">
                                                    <CalendarDaysIcon className="w-4 h-4 mr-1"/>
                                                    {formatDate(report.tasks?.deadline)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 右側: 進捗と展開アイコン */}
                                        <div className="flex items-center flex-shrink-0 sm:ml-4">
                                            {/* 進捗表示エリア */}
                                            <div className="text-right mr-4">
                                                <span
                                                    className={`text-sm font-bold ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                                                    {report.pre_progress}% → {report.progress}%
                                                    {progressDiff > 0 && (
                                                        <span className="text-green-600 ml-1">(+{progressDiff}%)</span>
                                                    )}
                                                    {progressDiff < 0 && (
                                                        <span className="text-red-600 ml-1">({progressDiff}%)</span>
                                                    )}
                                                </span>
                                                <div
                                                    className="w-24 mt-1 bg-gray-200 rounded-full h-2 overflow-hidden relative">
                                                    <div className="bg-blue-300 h-2 rounded-full absolute"
                                                         style={{width: `${report.pre_progress}%`, zIndex: 1}}></div>
                                                    <div
                                                        className={`${isCompleted ? 'bg-green-500' : 'bg-blue-600'} h-2 rounded-full absolute transition-width duration-500 ease-in-out`}
                                                        style={{width: `${report.progress}%`, zIndex: 2}}></div>
                                                </div>
                                            </div>

                                            {/* 展開/折りたたみアイコン */}
                                            <div className="flex-shrink-0">
                                                {isSelected ? (
                                                    <ChevronUpIcon className="w-5 h-5 text-gray-400"/>
                                                ) : (
                                                    <ChevronDownIcon className="w-5 h-5 text-gray-400"/>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 詳細セクション (選択時のみ表示) */}
                                    {isSelected && (
                                        <div className="px-4 py-4 sm:px-10 border-t border-gray-200 bg-gray-50">
                                            {/* 詳細をグリッドでレイアウト */}
                                            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-3">
                                                <div className="sm:col-span-1">
                                                    <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                                        <DocumentTextIcon className="w-4 h-4 mr-1"/> タスクの詳細
                                                    </dt>
                                                    <dd className="text-sm text-gray-900 break-words">{report.tasks?.description ?? 'N/A'}</dd>
                                                </div>
                                                <div className="sm:col-span-1">
                                                    <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                                        <ChatBubbleLeftEllipsisIcon className="w-4 h-4 mr-1"/> 最新のコメント
                                                    </dt>
                                                    <dd className="text-sm text-gray-900 italic">{report.comment || 'No comment'}</dd>
                                                </div>
                                                <div className="sm:col-span-1">
                                                    <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                                        <ClockIcon className="w-4 h-4 mr-1"/> タスクの更新日
                                                    </dt>
                                                    <dd className="text-sm text-gray-900">{formatDate(report.created_at)}</dd>
                                                </div>
                                            </dl>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default ReportComponent;