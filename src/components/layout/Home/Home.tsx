"use client"
import AttendanceContent from "@/components/layout/Home/Attendance/AttendanceContent";
import DashboardContent from "@/components/layout/Home/Dashboard/DashboardContent";
import Header from "@/components/layout/Header";
import TaskContent from "@/components/layout/Home/Task/TaskContent";
import MailContent from "@/components/layout/Home/Mail/MailContent";
import { useEffect, useState } from "react";
import { BsClock, BsEnvelope } from "react-icons/bs";
import { BsGrid } from "react-icons/bs";
import { BsCardChecklist } from "react-icons/bs";

export default function Home({ session }: SessionProps) {

    // 現在選択中のコンテンツを state で保持
    const [activeContent, setActiveContent] = useState<"dashboard" | "attendance" | "task" | "mail">("dashboard");

    const renderContent = () => {
        switch (activeContent) {
            case "dashboard":
                return <DashboardContent />;
            case "attendance":
                return <AttendanceContent session={session} />;
            case "task":
                return <TaskContent session={session} />;
            case "mail":
                return <MailContent session={session} />;
            default:
                return <DashboardContent />;
        }
    };

    useEffect(() => {
        const registerUserIfNew = async () => {
            if (!session?.user?.email) return;

            try {
                const res = await fetch("/api/users", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: session.user.name,
                        email: session.user.email,
                        image: session.user.image,
                    }),
                });

                const data = await res.json();
                console.log(data);

            } catch (error) {
                console.error("User registration failed:", error);
            }
        };

        registerUserIfNew();
    }, [session]);

    return (
        <div className="h-screen bg-white flex flex-col">
            {/* ヘッダー */}
            <Header session={session} />

            {/* メインエリア */}
            <div className="flex flex-1 overflow-hidden">
                {/* サイドナビゲーション */}
                <aside
                    className="w-40 p-4 transition-all duration-300 ease-in-out shadow-md border-r border-gray-200 block"
                >
                    <nav className="flex flex-col space-y-6">
                        {/* グループ1: メイン機能 */}
                        <div>
                            <h3 className="uppercase text-md font-semibold mb-2">共通</h3>
                            <ul className="flex flex-col space-y-1">
                                <li
                                    onClick={() => setActiveContent("dashboard")}
                                    className={`flex gap-2 items-center px-2 py-1 rounded-md cursor-pointer transition-colors duration-200 ${activeContent === "dashboard" ? "bg-gray-200" : ""}`}
                                >
                                    <BsGrid className="text-xl" />
                                    <span className="text-gray-700">ダッシュボード</span>
                                </li>
                            </ul>
                        </div>

                        {/* グループ2: 設定関連 */}
                        <div>
                            <h3 className="uppercase text-md font-semibold mb-2">個人</h3>
                            <ul className="flex flex-col space-y-1">
                                <li
                                    onClick={() => setActiveContent("attendance")}
                                    className={`flex gap-2 items-center px-2 py-1 rounded-md cursor-pointer transition-colors duration-200 ${activeContent === "attendance" ? "bg-gray-200" : ""
                                        }`}
                                >
                                    <BsClock className="text-xl" />
                                    <span className="text-gray-700">出勤打刻</span>
                                </li>
                                <li
                                    onClick={() => setActiveContent("task")}
                                    className={`flex gap-2 items-center px-2 py-1 rounded-md cursor-pointer transition-colors duration-200 ${activeContent === "task" ? "bg-gray-200" : ""
                                        }`}
                                >
                                    <BsCardChecklist className="text-xl" />
                                    <span className="text-gray-700">タスク管理</span>
                                </li>
                                <li
                                    onClick={() => setActiveContent("mail")}
                                    className={`flex gap-2 items-center px-2 py-1 rounded-md cursor-pointer transition-colors duration-200 ${activeContent === "mail" ? "bg-gray-200" : ""
                                        }`}
                                >
                                    <BsEnvelope className="text-xl" />
                                    <span className="text-gray-700">メール管理</span>
                                </li>
                            </ul>
                        </div>
                    </nav>
                </aside>


                {/* メインコンテンツ */}
                <main className="flex-1 p-6 overflow-auto">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}
