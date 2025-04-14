import { useState } from "react";
import { BsEnvelope } from "react-icons/bs";
import InboxComponent from "./InboxComponent";
import BccComponent from "./BccComponent";

const InboxContent = () => {
  const [activeTab, setActiveTab] = useState<'stamp' | 'attendance'>("stamp");

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <BsEnvelope className="text-2xl relative top-[1.1px]" />
        <h1 className="text-2xl font-semibold text-gray-700">メール管理</h1>
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
            受信ボックス
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
            一斉送信
          </button>
        </div>
      </div>

      {/* 状態に応じて表示するコンポーネントを切り替える */}
      <div className="mt-4">
        {activeTab === "stamp" && <InboxComponent />}
        {activeTab === "attendance" && <BccComponent />}
      </div>
    </div>
  )
}

export default InboxContent