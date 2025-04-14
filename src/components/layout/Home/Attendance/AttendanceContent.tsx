import { useState } from "react";
import { BsClock } from "react-icons/bs";
import StampComponent from "./StampComponent";
import AttendanceRecordComponent from "./AttendanceRecordComponent";

const AttendanceContent = ({ session }: SessionProps) => {
    const [activeTab, setActiveTab] = useState<'stamp' | 'attendance'>("stamp");

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <BsClock className="text-2xl relative top-[1.1px]" />
                <h1 className="text-2xl font-semibold text-gray-700">打刻管理</h1>
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
                        打刻
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
                        出勤簿
                    </button>
                </div>
            </div>

            {/* 状態に応じて表示するコンポーネントを切り替える */}
            <div className="mt-4">
                {activeTab === "stamp" && <StampComponent session={session} />}
                {activeTab === "attendance" && <AttendanceRecordComponent session={session} />}
            </div>
        </div>
    );
};

export default AttendanceContent;
