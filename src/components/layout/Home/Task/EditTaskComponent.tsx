import Image from 'next/image';
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {
    UsersIcon, // ユーザーリストアイコン
    ListBulletIcon, // タスクリストアイコン
    PlusCircleIcon, // 追加アイコン
    ExclamationTriangleIcon, // エラーアイコン
    CheckCircleIcon, // 成功アイコン
    CalendarDaysIcon // 期限アイコン (既存タスク表示用)
} from '@heroicons/react/24/outline';

const EditTaskComponent: React.FC<SessionProps> = () => {
    // --- State定義 ---
    const [users, setUsers] = useState<User[]>([]); // 担当者候補リスト
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null); // 選択中の担当者ID
    const [userTasks, setUserTasks] = useState<Task[]>([]); // 選択中担当者のタスクリスト

    // フォーム入力用State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');

    // ローディング・フィードバック用State
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [addSuccessMessage, setAddSuccessMessage] = useState<string | null>(null);
    const messageTimerRef = useRef<NodeJS.Timeout | null>(null); // メッセージ自動クリア用

    // --- クリーンアップ処理 ---
    useEffect(() => {
        return () => {
            if (messageTimerRef.current) {
                clearTimeout(messageTimerRef.current);
            }
        };
    }, []);

    // --- データ取得 ---
    // ユーザー一覧取得
    const fetchUsers = useCallback(async () => {
        setIsLoadingUsers(true);
        setAddError(null);
        setAddSuccessMessage(null); // 他のメッセージはクリア
        try {
            const res = await fetch('/api/users'); // 全ユーザー取得API (必要ならフィルタ)
            if (!res.ok) throw new Error("Failed to fetch users");
            const data = await res.json();
            setUsers(data ?? []);
        } catch (err) {
            console.error(err);
            setAddError("ユーザーリストの取得に失敗しました。"); // エラー表示を統一
            setUsers([]);
        } finally {
            setIsLoadingUsers(false);
        }
    }, []);

    // 選択ユーザーのタスク一覧取得
    const fetchUserTask = useCallback(async (userId: number) => {
        setIsLoadingTasks(true);
        setAddError(null);
        setAddSuccessMessage(null);
        setUserTasks([]); // ユーザー変更時は一旦クリア
        try {
            const res = await fetch(`/api/tasks?assigner_id=${userId}`); // APIを叩く
            if (!res.ok) throw new Error("Failed to fetch user tasks");
            const data = await res.json();
            setUserTasks(data ?? []);
        } catch (err) {
            console.error(err);
            setAddError("担当者のタスク取得に失敗しました。");
            setUserTasks([]);
        } finally {
            setIsLoadingTasks(false);
        }
    }, []);

    // 初期化
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // ユーザー選択変更時にタスクを取得
    useEffect(() => {
        if (selectedUserId !== null) {
            fetchUserTask(selectedUserId);
            // フォームもクリア（任意）
            // setTitle(''); setDescription(''); setDeadline('');
        } else {
            setUserTasks([]); // ユーザー選択解除時はタスクリストをクリア
        }
    }, [selectedUserId, fetchUserTask]);

    // --- フォーム入力ハンドラ ---
    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setter(e.target.value);
        setAddError(null); // 入力時にエラー/成功メッセージをクリア
        setAddSuccessMessage(null);
    };

    // --- タスク追加処理 ---
    const handleAddTask = async () => {
        if (!selectedUserId) {
            setAddError("まず担当者を選択してください。");
            return;
        }
        if (!title.trim() || !description.trim() || !deadline) {
            setAddError("タイトル、説明、期限は必須です。");
            return;
        }

        setIsAddingTask(true);
        setAddError(null);
        setAddSuccessMessage(null);
        if (messageTimerRef.current) {
            clearTimeout(messageTimerRef.current);
        }

        try {
            // マネージャーIDはAPI側でセッションから取得すると仮定
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    action: "add",
                    title: title,
                    description: description,
                    deadline: deadline,
                    assigner_id: selectedUserId,
                    // manager_id はAPI側で付与
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({error: "タスク追加中にエラーが発生しました。"}));
                throw new Error(errorData.error || "タスク追加に失敗しました");
            }

            // const data = await res.json(); // 成功時のデータ（オプション）
            setAddSuccessMessage("タスクが正常に追加されました！");
            setTitle('');
            setDescription('');
            setDeadline(''); // フォームクリア

            // 成功したらタスクリストを再取得
            fetchUserTask(selectedUserId);

            // 成功メッセージを自動クリア
            messageTimerRef.current = setTimeout(() => {
                setAddSuccessMessage(null);
                messageTimerRef.current = null;
            }, 4000);

        } catch (err) {
            console.error(err);
            setAddError(err instanceof Error ? err.message : "タスク追加中にエラーが発生しました。");
        } finally {
            setIsAddingTask(false);
        }
    };

    // 日付フォーマット (既存タスク表示用)
    const formatDate = (dateString: string | undefined | null): string => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('ja-JP', {year: 'numeric', month: 'short', day: 'numeric'});
        } catch {
            return dateString;
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-100">
            {/* 左パネル：ユーザーリスト */}
            <div className="w-full md:w-1/4 lg:w-1/5 flex flex-col border-r border-gray-200 bg-white">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-base font-semibold text-gray-700 flex items-center">
                        <UsersIcon className="w-5 h-5 mr-2 text-gray-400"/>
                        担当者を選択
                    </h2>
                </div>
                {isLoadingUsers ? (
                    <div className="flex-grow flex items-center justify-center text-gray-500">読み込み中...</div>
                ) : users.length === 0 ? (
                    <div
                        className="flex-grow flex items-center justify-center text-gray-500 p-4">ユーザーがいません。</div>
                ) : (
                    <div className="flex-grow overflow-y-auto">
                        <ul> {/* <ul> に変更 */}
                            {users.map(user => (
                                <li key={user.id}> {/* <li> に変更 */}
                                    <button // クリック要素を button に変更 (アクセシビリティ向上)
                                        onClick={() => setSelectedUserId(user.id)}
                                        className={`
                                            w-full flex items-center gap-3 p-3 text-left transition duration-150 ease-in-out border-l-4 hover:bg-gray-100 focus:outline-none focus:bg-gray-100
                                            ${selectedUserId === user.id ? 'border-indigo-500 bg-indigo-50' : 'border-transparent'}
                                        `}
                                    >
                                        <Image
                                            src={user.image || '/default-avatar.png'} // フォールバック画像
                                            alt={`${user.name}のアバター`}
                                            width={32} height={32}
                                            className="w-8 h-8 rounded-full flex-shrink-0"
                                            onError={(e) => {
                                                e.currentTarget.src = '/default-avatar.png';
                                            }} // 画像ロードエラー時のフォールバック
                                        />
                                        <span className="text-sm font-medium text-gray-800 truncate">{user.name}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* 右パネル：メインコンテンツ */}
            <div className="w-full md:w-3/4 lg:w-4/5 flex flex-col overflow-y-auto"> {/* 縦スクロールを可能に */}
                {/* 既存タスク表示エリア */}
                <div className="p-4 md:p-6 border-b border-gray-200 bg-white">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <ListBulletIcon className="w-5 h-5 mr-2 text-gray-400"/>
                        {selectedUserId ? `${users.find(u => u.id === selectedUserId)?.name ?? '選択ユーザー'} の担当タスク` : '担当者を選択してください'}
                    </h3>
                    {isLoadingTasks ? (
                        <div className="text-center text-gray-500 py-4">タスクを読み込み中...</div>
                    ) : selectedUserId === null ? (
                        <div className="text-center text-gray-400 py-4">担当者を選択するとタスクが表示されます。</div>
                    ) : userTasks.length === 0 ? (
                        <div className="text-center text-gray-500 py-4">この担当者のタスクはありません。</div>
                    ) : (
                        <div
                            className="max-h-60 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-200"> {/* 高さ制限とスクロール */}
                            {userTasks.map(task => (
                                <div key={task.id} className="px-4 py-3 bg-gray-50">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-gray-900">{task.title}</span>
                                        <span className="text-xs text-gray-500 flex items-center">
                                             <CalendarDaysIcon className="w-3 h-3 mr-1"/>
                                            {formatDate(task.deadline)}
                                         </span>
                                    </div>
                                    <div className="w-full bg-gray-300 rounded-full h-1.5">
                                        <div
                                            className={`h-1.5 rounded-full ${task.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                            style={{width: `${task.progress}%`}}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-gray-500">{task.progress}%</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* タスク追加フォームエリア */}
                <div className="p-4 md:p-6 flex-grow flex items-center justify-center"> {/* 中央寄せ */}
                    <div className="w-full max-w-lg bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-5 flex items-center">
                            <PlusCircleIcon className="w-5 h-5 mr-2 text-gray-400"/>
                            新しいタスクを追加
                        </h3>

                        {/* フォーム要素: ユーザー未選択時は非活性 */}
                        <fieldset disabled={selectedUserId === null || isAddingTask}
                                  className="space-y-4 disabled:opacity-60">
                            <div>
                                <label htmlFor="title"
                                       className="block text-sm font-medium text-gray-700 mb-1">タイトル <span
                                    className="text-red-600">*</span></label>
                                <input
                                    id="title" type="text" value={title}
                                    onChange={handleInputChange(setTitle)}
                                    placeholder="タスクのタイトルを入力"
                                    required
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                                />
                            </div>
                            <div>
                                <label htmlFor="description"
                                       className="block text-sm font-medium text-gray-700 mb-1">説明 <span
                                    className="text-red-600">*</span></label>
                                <textarea
                                    id="description" value={description}
                                    onChange={handleInputChange(setDescription)}
                                    placeholder="タスクの詳細な説明を入力"
                                    required rows={4}
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 resize-none"
                                />
                            </div>
                            <div>
                                <label htmlFor="deadline"
                                       className="block text-sm font-medium text-gray-700 mb-1">期限 <span
                                    className="text-red-600">*</span></label>
                                <input
                                    id="deadline" type="date" value={deadline}
                                    onChange={handleInputChange(setDeadline)}
                                    required
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                                    min={new Date().toISOString().split('T')[0]} // 今日以降の日付のみ選択可能（例）
                                />
                            </div>
                        </fieldset>

                        {/* エラー・成功メッセージ */}
                        {addError && (<div
                            className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded flex items-center">
                            <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0"/>{addError}</div>)}
                        {addSuccessMessage && (<div
                            className="mt-4 p-3 bg-green-100 border border-green-300 text-green-700 text-sm rounded flex items-center">
                            <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0"/>{addSuccessMessage}</div>)}

                        {/* 追加ボタン */}
                        <div className="mt-6">
                            <button
                                type='button'
                                onClick={handleAddTask}
                                disabled={selectedUserId === null || isAddingTask || !title.trim() || !description.trim() || !deadline}
                                className="w-full py-2.5 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                <PlusCircleIcon className={`w-5 h-5 mr-2 ${isAddingTask ? 'animate-spin' : ''}`}/>
                                {isAddingTask ? '追加中...' : 'タスクを追加する'}
                            </button>
                            {selectedUserId === null && (
                                <p className="text-xs text-center text-gray-500 mt-2">担当者を選択するとタスクを追加できます。</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EditTaskComponent;
