import { createClient } from '@/app/lib/utils/supabase/client';
import Image from 'next/image';
import React, { useEffect, useState } from 'react'

interface SessionProps {
  session: any
}

const EditTaskComponent: React.FC<SessionProps> = ({ session }) => {
  // 各入力項目の状態管理
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');

  const [users, setUsers] = useState<User[]>([]);

  const supabase = createClient();

  // フォーム送信処理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setUserId('');
    setTitle('');
    setDescription('');
    setDeadline('');
  };

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

  useEffect(() => {
    fetchUsers();
  }, [])

  return (
    <div className="flex">

      <div className="w-1/2 flex items-center justify-center bg-gray-200">
        <div className="p-6">
          {users.map(user => (
            <div key={user.id} className="bg-white rounded shadow p-4 mb-4 flex">
              <p>{user.name}</p>
              <Image
                src={""}
                alt="ユーザーアイコン"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="w-1/2 flex items-center justify-center">
        <div className="w-full p-6">
          <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            {/* ユーザID */}
            <div className="mb-4">
              <label htmlFor="userId" className="block text-gray-700 text-sm font-bold mb-2">
                ユーザID
              </label>
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="ユーザIDを入力"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>

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

  )
}

export default EditTaskComponent;
