import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    ArrowPathIcon, // 更新アイコン
    PaperAirplaneIcon, // 申請アイコン
    ExclamationTriangleIcon, // エラーアイコン
    CheckCircleIcon, // 成功アイコン
    ListBulletIcon, // タスクリストアイコン
    PencilSquareIcon, // 更新パネルアイコン
    LockClosedIcon // 申請済みを示すアイコン
} from '@heroicons/react/24/outline';

const SelfTaskComponent: React.FC<SessionProps> = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectTask, setSelectTask] = useState<number | undefined>(undefined);
    const [selectedProgress, setSelectedProgress] = useState<number>(0);
    const [selectedComment, setSelectedComment] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true); // 初期読み込み + 更新/申請中のローディング
    const [error, setError] = useState<string | null>(null); // フェッチエラー、更新/申請エラー用
    const [successMessage, setSuccessMessage] = useState<string | null>(null); // 更新/申請成功メッセージ
    const [originalProgress, setOriginalProgress] = useState<number>(0); // タスク選択時の元の進捗
    const successTimerRef = useRef<NodeJS.Timeout | null>(null); // 成功メッセージタイマー用Ref

    // クリーンアップ処理
    useEffect(() => {
        // コンポーネントがアンマウントされる時にタイマーをクリア
        return () => {
            if (successTimerRef.current) {
                clearTimeout(successTimerRef.current);
            }
        };
    }, []);

    // タスク一覧取得
    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            // ユーザーIDを取得
            const res = await fetch("/api/my-tasks");
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({error: `Failed to fetch tasks: ${res.status}`}));
                throw new Error(errorData.error || "Failed to fetch user data.");
            }
            const data: Task[] = await res.json();
            setTasks(data ?? []);
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setError(err instanceof Error ? err.message : 'タスクの読み込みに失敗しました。');
            setTasks([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // タスク選択時の処理 (originalProgress をセット)
    useEffect(() => {
        if (selectTask !== undefined) {
            const task = tasks.find(t => t.id === selectTask);
            const initialProgress = task?.progress ?? 0;
            setSelectedProgress(initialProgress);
            setOriginalProgress(initialProgress); // <<<--- 元の進捗を保存
            setSelectedComment('');
            setError(null);
            // 既存のタイマーがあればクリアしてから新しいメッセージをセットしない（選択変更時はクリアが自然）
            if (successTimerRef.current) { clearTimeout(successTimerRef.current); }
            setSuccessMessage(null);
        }
    }, [selectTask, tasks]);

    // --- ハンドラ ---
    const handleSelectedSliderChange = (value: number) => {
        setSelectedProgress(value);
        setError(null); // 操作時にエラーをクリア
        setSuccessMessage(null);
    };
    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSelectedComment(e.target.value);
        setError(null); // 操作時にエラーをクリア
        setSuccessMessage(null);
    };

    // 右パネル：「更新する」「申請する」共通のAPI呼び出し部分
    const callUpdateApi = async (actionText: string) => {
        if (selectTask === undefined) return;
        if (!selectedComment.trim()) {
            setError(`${actionText}にはコメントが必要です。`);
            return;
        }
        // 申請の場合、100%チェック
        if (actionText === '申請' && selectedProgress !== 100) {
            setError('進捗が100%の場合のみ申請できます。');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        // 既存の成功メッセージタイマーをクリア
        if (successTimerRef.current) {
            clearTimeout(successTimerRef.current);
        }

        try {
            const res = await fetch(`/api/my-tasks`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    taskId: selectTask,
                    newProgress: selectedProgress,
                    comment: selectedComment
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({error: `Failed to ${actionText}: ${res.status}`}));
                throw new Error(errorData.error || `Failed to ${actionText}: ${res.status}`);
            }

            const updatedTask: Task = await res.json(); // APIは更新後のタスクを返す想定

            // ローカル状態を更新
            setTasks(prev => prev.map(t => t.id === selectTask ? updatedTask : t));
            setSuccessMessage(actionText === '更新' ? `進捗を${selectedProgress}%に更新しました。` : "タスクの完了申請を送信しました。");
            setSelectedComment(''); // 成功したらコメント欄をクリア

            // 成功メッセージを数秒後に自動で消す
            successTimerRef.current = setTimeout(() => {
                setSuccessMessage(null);
                successTimerRef.current = null; // タイマーIDをクリア
            }, 4000); // 4秒後に消す (時間は調整可能)

            // 申請成功後、選択を解除するなどの追加UXも可能
            // if (actionText === '申請') { setSelectTask(undefined); }

        } catch (error) {
            console.error(`Error ${actionText}:`, error);
            setError(error instanceof Error ? error.message : `${actionText}に失敗しました。`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateSelected = () => callUpdateApi('更新');
    const handleRequestApproval = () => callUpdateApi('申請');

    // --- ヘルパー関数 ---
    const formatDate = (dateString: string | undefined | null): string => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('ja-JP', {year: 'numeric', month: 'short', day: 'numeric'});
        } catch {
            return dateString;
        }
    };
    const selectedTaskDetails = tasks.find(t => t.id === selectTask);

    // スライダーの背景スタイル計算
    const sliderBackgroundStyle = (progress: number) => {
        const progressPercent = Math.min(100, Math.max(0, progress)); // 0-100に丸める
        // Tailwindのカラーを取得 (直接指定 or CSS変数)
        const activeColor = '#4f46e5'; // indigo-600
        const inactiveColor = '#e5e7eb'; // gray-200
        return {
            background: `linear-gradient(to right, ${activeColor} ${progressPercent}%, ${inactiveColor} ${progressPercent}%)`
        };
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-100">
            {/* 左側：タスクリスト */}
            <div className="w-full md:w-2/5 lg:w-1/3 flex flex-col border-r border-gray-200 bg-white">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                        <ListBulletIcon className="w-5 h-5 mr-2 text-gray-500"/>
                        あなたのタスク
                    </h2>
                </div>
                {isLoading && tasks.length === 0 ? (
                    <div className="flex-grow flex items-center justify-center text-gray-500">読み込み中...</div>
                ) : tasks.length === 0 ? (
                    <div
                        className="flex-grow flex items-center justify-center text-gray-500 p-4">担当中のタスクはありません。</div>
                ) : (
                    <div className="flex-grow overflow-y-auto">
                        <ul className="divide-y divide-gray-200">
                            {tasks.map(task => (
                                <li
                                    key={task.id}
                                    onClick={() => setSelectTask(task.id)}
                                    className={`
                                         p-4 cursor-pointer transition duration-150 ease-in-out block hover:bg-gray-50
                                         ${selectTask === task.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}
                                     `}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                         <span className="text-sm font-medium text-indigo-700 truncate"
                                               title={task.title}>
                                             {task.title}
                                         </span>
                                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                             期限: {formatDate(task.deadline)}
                                         </span>
                                    </div>
                                    {/* シンプルな進捗バー */}
                                    <div className="flex items-center justify-between text-xs text-gray-600">
                                        <span>進捗</span>
                                        <span>{task.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                        <div
                                            className={`h-1.5 rounded-full ${task.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                            style={{width: `${task.progress}%`}}
                                        ></div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* 右側：選択タスクの詳細・更新パネル */}
            <div className="w-full md:w-3/5 lg:w-2/3 flex items-center justify-center p-4 md:p-8">
                <div className="w-full max-w-lg bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-5 text-gray-800 flex items-center">
                        <PencilSquareIcon className="w-5 h-5 mr-2 text-gray-500"/>
                        タスクの更新・申請
                    </h2>

                    {selectTask !== undefined && selectedTaskDetails ? (
                        <div>
                            <h3 className="text-lg font-semibold text-indigo-800 mb-1">{selectedTaskDetails.title}</h3>
                            <p className="text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200">{selectedTaskDetails.description}</p>

                            {/* 現在の進捗表示 */}
                            <div className="mb-3 text-center">
                                <span className="text-3xl font-bold text-blue-600">{selectedProgress}%</span>
                            </div>

                            {/* スライダー */}
                            <input
                                type="range"
                                min="0" max="100" step="10"
                                value={selectedProgress}
                                onChange={e => handleSelectedSliderChange(Number(e.target.value))}
                                disabled={isLoading || originalProgress === 100}
                                className="w-full mb-4 h-2 bg-transparent rounded-lg appearance-none cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-0" // 背景を透明に
                                style={sliderBackgroundStyle(selectedProgress)}
                            />

                            {/* コメント入力欄 */}
                            <div className="mb-4">
                                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">コメント
                                    (必須)</label>
                                <textarea
                                    id="comment"
                                    value={selectedComment}
                                    onChange={handleCommentChange}
                                    placeholder="進捗の状況や完了報告などを記入してください..."
                                    disabled={isLoading || originalProgress === 100}
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 resize-none"
                                />
                            </div>

                            {/* エラー・成功メッセージ表示 */}
                            {error && (<div
                                className="my-3 p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded flex items-center">
                                <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0"/>{error}</div>)}
                            {successMessage && (<div
                                className="my-3 p-3 bg-green-100 border border-green-300 text-green-700 text-sm rounded flex items-center">
                                <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0"/>{successMessage}</div>)}


                            {/* アクションボタン */}
                            <div className="mt-6">
                                {selectedProgress < 100 ? (
                                    <button
                                        onClick={handleUpdateSelected}
                                        disabled={isLoading || !selectedComment.trim()} // コメント必須＆ローディング中は無効
                                        className="w-full py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        <ArrowPathIcon className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}/>
                                        {isLoading ? '更新中...' : '進捗を更新する'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleRequestApproval}
                                        disabled={
                                            isLoading ||
                                            !selectedComment.trim() ||
                                            originalProgress === 100 // <<<--- 元の進捗が100なら非活性
                                        }
                                        className={`
                                            w-full py-2.5 px-4 rounded-md text-white font-semibold text-sm shadow-sm transition
                                            focus:outline-none focus:ring-2 focus:ring-offset-2
                                            ${originalProgress === 100
                                            ? 'bg-gray-400 cursor-not-allowed' // 既に完了済みの場合のスタイル
                                            : 'bg-green-600 hover:bg-green-700 focus:ring-green-500' // 通常の申請ボタンスタイル
                                        }
                                            disabled:opacity-70 flex items-center justify-center
                                            ${originalProgress !== 100 && !selectedComment.trim() ? 'disabled:cursor-not-allowed' : ''} // コメント未入力時のカーソル
                                        `}
                                    >
                                        {originalProgress === 100 ? (
                                            <LockClosedIcon className="w-4 h-4 mr-2"/> // 完了済みアイコン
                                        ) : (
                                            <PaperAirplaneIcon className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}/> // 通常アイコン
                                        )}
                                        {/* ボタンテキストの変更 */}
                                        {originalProgress === 100
                                            ? '申請済み (または完了済み)'
                                            : isLoading && !error && !successMessage ? '申請中...' : '完了申請する' // ローディング表示を調整
                                        }
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 pt-10">
                            <p>左のリストからタスクを選択して<br/>進捗を更新または完了申請してください。</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SelfTaskComponent;
