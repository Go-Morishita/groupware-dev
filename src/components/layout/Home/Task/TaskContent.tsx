import { useState } from "react";
import { BsCardChecklist } from "react-icons/bs";
import SelfTaskComponent from "./SelfTaskComponent";
import EditTaskComponent from "./EditTaskComponent";

const TaskContent = ({ session }: SessionProps) => {
  // activeTab には 'stamp' または 'attendance' が入る（初期値は 'stamp' とする）
  const [activeTab, setActiveTab] = useState<'stamp' | 'attendance'>("stamp");

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <BsCardChecklist className="text-2xl relative top-[1.1px]" />
        <h1 className="text-2xl font-semibold text-gray-700">タスク管理</h1>
      </div>

      {/* サブヘッダー */}
      <div className="border-b border-gray-300">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("stamp")}
            className={`relative pb-3 font-medium text-md transition duration-200 
                            after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 
                            after:bg-blue-600 after:origin-left after:transition-transform after:duration-300 
                            ${activeTab === "stamp"
                ? "text-blue-600 after:scale-x-100"
                : "text-gray-600 after:scale-x-0"}`}
          >
            マイタスク
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`relative pb-3 font-medium text-md transition duration-200 
                            after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 
                            after:bg-blue-600 after:origin-left after:transition-transform after:duration-300 
                            ${activeTab === "attendance"
                ? "text-blue-600 after:scale-x-100"
                : "text-gray-600 after:scale-x-0"}`}
          >
            タスク追加
          </button>
        </div>
      </div>

      {/* 状態に応じて表示するコンポーネントを切り替える */}
      <div className="mt-4">
        {activeTab === "stamp" && <SelfTaskComponent session={session} />}
        {activeTab === "attendance" && <EditTaskComponent session={session} />}
      </div>
    </div>
  );
};

export default TaskContent