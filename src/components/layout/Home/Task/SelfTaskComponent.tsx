import { createClient } from '@/app/lib/utils/supabase/client';
import React, { useEffect, useState } from 'react'

const SelfTaskComponent: React.FC<SessionProps> = ({ session }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const supabase = createClient();

  // スライダー変更時にタスクの進捗値をローカル状態で更新
  const handleSliderChange = (id: number, value: number) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id ? { ...task, progress: value } : task
      )
    );
  };

  // Supabaseからタスクを取得する関数
  const fetchTasks = async () => {
    const res = await fetch(`/api/users?email=${session?.user?.email}`);
    const userData = await res.json();
    const id = userData?.id;

    const { data, error } = await supabase
      .from("tasks")
      .select('*')
      .eq('assigner_id', id);

    if (error) {
      console.error("Error fetching tasks:", error);
    }

    setTasks(data ?? []);
  };

  // コンポーネントマウント時に一度だけタスクを取得
  useEffect(() => {
    fetchTasks();
  }, []);

  // 「進捗を更新する」ボタン押下時の処理
  const handleUpdateProgress = async () => {
    const supabase = createClient();
    try {
      // 各タスクの進捗値を更新するためのクエリをPromise.allで実行
      const updatePromises = tasks.map(task =>
        supabase
          .from("tasks")
          .update({ progress: task.progress })
          .eq("id", task.id)
      );
      await Promise.all(updatePromises);
      alert("進捗が更新されました");
    } catch (error) {
      console.error("Error updating progress:", error);
      alert("進捗の更新に失敗しました");
    }
  };

  return (
    <div className="flex">
      {/* 右側カラム：flex-col を追加して縦方向に並べる */}
      <div className="w-1/2 flex flex-col items-center justify-center bg-gray-200">
        {/* 内部コンテナで中央寄せ＆幅を指定 */}
        <div className="w-full p-6">
          {tasks.map(task => (
            <div key={task.id} className="bg-white rounded shadow p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">{task.title}</h2>
                {/* 期限をフォーマットして表示 */}
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
                onChange={(e) => handleSliderChange(task.id, Number(e.target.value))}
                className="w-full"
              />
            </div>
          ))}
          <div className="flex justify-center mt-6">
            <button
              onClick={handleUpdateProgress}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              進捗を更新する
            </button>
          </div>
        </div>
      </div>
      <div className="w-1/2 flex items-center justify-center bg-gray-200">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">左側のコンテンツ</h2>
          <p>ここに任意の情報やイラストなどを表示できます。</p>
        </div>
      </div>
    </div>

  );
};

export default SelfTaskComponent;
