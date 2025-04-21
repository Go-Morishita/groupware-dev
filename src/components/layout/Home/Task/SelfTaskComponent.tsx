import { createClient } from '@/app/lib/utils/supabase/client';
import React, { useEffect, useState } from 'react';

const SelfTaskComponent: React.FC<SessionProps> = ({ session }) => {
  const [selectTask, setSelectTask] = useState<number>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProgress, setSelectedProgress] = useState<number>(0);
  const [selectedComment, setSelectedComment] = useState<string>('');
  const supabase = createClient();

  // タスク一覧取得
  const fetchTasks = async () => {
    const res = await fetch(`/api/users?email=${session?.user?.email}`);
    const userData = await res.json();
    const id = userData?.id;
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigner_id', id);

    if (error) {
      console.error('Error fetching tasks:', error);
      return;
    }
    setTasks(data ?? []);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // タスク選択時に右パネル用の進捗＆コメントを初期化
  useEffect(() => {
    if (selectTask !== undefined) {
      const task = tasks.find(t => t.id === selectTask);
      setSelectedProgress(task?.progress ?? 0);
      setSelectedComment(''); // 前回コメントをクリア
    }
  }, [selectTask, tasks]);

  // 左リストのスライダー更新（ローカル状態のみ）
  const handleSliderChange = (id: number, value: number) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, progress: value } : task
      )
    );
  };

  // 右パネルのスライダー変更（10%刻み）
  const handleSelectedSliderChange = (value: number) => {
    setSelectedProgress(value);
  };

  // コメント入力欄の変更
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSelectedComment(e.target.value);
  };

  // 右パネル：単一タスクの進捗を更新
  const handleUpdateSelected = async () => {
    if (selectTask === undefined) return;
    if (!selectedComment.trim()) {
      alert('更新にはコメントが必要です');
      return;
    }
    try {
      await supabase
        .from('tasks')
        .update({ progress: selectedProgress /*, comment: selectedComment if your schema supports */ })
        .eq('id', selectTask);
      // ローカル状態も更新
      setTasks(prev =>
        prev.map(t =>
          t.id === selectTask ? { ...t, progress: selectedProgress } : t
        )
      );
      alert(`進捗を${selectedProgress}%に更新しました。\nコメント: ${selectedComment}`);
    } catch (error) {
      console.error(error);
      alert('進捗の更新に失敗しました');
    }
  };

  // 右パネル：「責任者に申請する」
  const handleRequestApproval = () => {
    if (!selectedComment.trim()) {
      alert('申請にはコメントが必要です');
      return;
    }
    // ここで API 呼び出し等を行ってください
    alert(`責任者に申請しました。\nコメント: ${selectedComment}`);
  };

  return (
    <div className="flex h-full">
      {/* 左側：タスクリスト */}
      <div className="w-1/2 flex flex-col items-center justify-center bg-gray-200 overflow-auto">
        <div className="w-full p-6">
          {tasks.map(task => (
            <div
              key={task.id}
              onClick={() => setSelectTask(task.id)}
              className={`bg-white rounded shadow p-4 mb-4 cursor-pointer transition-all duration-200 border-2 ${selectTask === task.id
                ? 'border-blue-500'
                : 'border-transparent hover:border-gray-300'
                }`}
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">{task.title}</h2>
                <span className="text-gray-600">
                  {new Date(task.deadline).toLocaleDateString()}
                </span>
                <span className="text-gray-600">{task.progress}%</span>
              </div>
              <p className="text-gray-700 mb-4">{task.description}</p>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={task.progress}
                onChange={e =>
                  handleSliderChange(task.id, Number(e.target.value))
                }
                className="w-full"
              />
            </div>
          ))}
          <div className="flex justify-center mt-6">
            <button
              onClick={async () => {
                // 全件一括更新
                const updatePromises = tasks.map(task =>
                  supabase
                    .from('tasks')
                    .update({ progress: task.progress })
                    .eq('id', task.id)
                );
                try {
                  await Promise.all(updatePromises);
                  alert('全タスクの進捗を更新しました');
                } catch {
                  alert('一括更新に失敗しました');
                }
              }}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              全件進捗を更新する
            </button>
          </div>
        </div>
      </div>

      {/* 右側：選択タスクの進捗更新パネル */}
      <div className="w-1/2 flex items-center justify-center bg-gray-200">
        <div className="p-6 w-full max-w-sm bg-white rounded shadow">
          <h2 className="text-2xl font-bold mb-4">進捗更新</h2>

          {selectTask !== undefined ? (
            <>
              {/* ← ここで現在の進捗を表示 */}
              <p className="mb-3 text-lg font-medium">
                現在の進捗：<span className="text-blue-600">{selectedProgress}%</span>
              </p>

              {/* スライダー（10%刻み） */}
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={selectedProgress}
                onChange={e =>
                  handleSelectedSliderChange(Number(e.target.value))
                }
                className="w-full mb-4"
              />

              {/* コメント入力欄 */}
              <textarea
                value={selectedComment}
                onChange={handleCommentChange}
                placeholder="更新・申請のコメントを入力してください"
                className="w-full border p-2 mb-4 resize-none h-24"
              />

              {/* 更新ボタン */}
              <button
                onClick={handleUpdateSelected}
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2"
              >
                更新
              </button>

              {/* 進捗100%でのみ有効な「責任者に申請する」ボタン */}
              <button
                onClick={handleRequestApproval}
                disabled={selectedProgress !== 100}
                className={`w-full text-white font-bold py-2 px-4 rounded ${selectedProgress === 100
                  ? 'bg-green-500 hover:bg-green-700'
                  : 'bg-gray-300 cursor-not-allowed'
                  }`}
              >
                責任者に申請する
              </button>
            </>
          ) : (
            <p>タスクを選択してください。</p>
          )}
        </div>
      </div>

    </div>
  );
};

export default SelfTaskComponent;
