import { createClient } from '@/app/lib/utils/supabase/client';
import Image from 'next/image';
import React, { useEffect, useState } from 'react'

interface SessionProps {
  session: any
}

const EditTaskComponent: React.FC<SessionProps> = ({ session }) => {
  // 各入力項目の状態管理
  const [userId, setUserId] = useState<Number | null>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');

  const [usertasks, setUserTasks] = useState<Task[]>([]);

  const [users, setUsers] = useState<User[]>([]);

  const supabase = createClient();

  const handleAddTask = async () => {
    try {
      const { error: insertError } = await supabase.from("tasks").insert({
        title: title,
        description: description,
        deadline: deadline,
        manager_id: 3,
        assigner_id: userId
      })
    } catch (err: any) {
      console.log(err);
    }
  }

  const fetchUsers = async () => {
    try {
      const { data } = await supabase.from("users").select('*');
      setUsers(data ?? []);
    } catch (e) {
      console.log(e);
    }
  }

  const fetchUsertask = async (assigner_id: Number) => {
    try {
      const { data } = await supabase.from("tasks").select('*').eq('assigner_id', assigner_id);
      setUserTasks(data ?? []);
    } catch {

    }
  }

  useEffect(() => {
    fetchUsers();
  }, [])

  useEffect(() => {
    userId && fetchUsertask(userId);
  }, [userId])

  return (
    <div className="flex">

      <div className="w-1/4 flex items-center justify-center bg-gray-200">
        <div className="w-full p-6">
          {users.map(user => (
            <div
              key={user.id}
              onClick={() => setUserId(user.id)}
              className={`bg-white rounded shadow p-2 mb-4 flex gap-3 cursor-pointer transition-all duration-200 border-2 ${userId === user.id ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                }`}
            >
              <Image
                src={user.image.toString()}
                alt="ユーザーアイコン"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex items-center">
                <p>{user.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-3/4 flex items-center justify-center bg-gray-200">
        <div className="w-1/2 flex items-center justify-center">
          <div className="w-full p-6">
            {usertasks.map(task => (
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
                  readOnly
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="w-1/2 flex items-center justify-center">
          <div className="w-full p-6">
            <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">

              {/* タイトル */}
              <div className="mb-4">
                <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
                  タイトル
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="タスクのタイトル"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              {/* 説明 */}
              <div className="mb-4">
                <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
                  説明
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="タスクの詳細な説明"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows={4}
                  required
                />
              </div>

              {/* 期限 */}
              <div className="mb-4">
                <label htmlFor="deadline" className="block text-gray-700 text-sm font-bold mb-2">
                  期限
                </label>
                <input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              {/* 送信ボタン */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleAddTask}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  タスク追加
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

  )
}

export default EditTaskComponent;
