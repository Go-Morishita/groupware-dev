"use client"
import AttendanceContent from "@/components/AttendanceContent";
import DashboardContent from "@/components/DashboardContent";
import Header from "@/components/Header";
import InboxContent from "@/components/InboxContent";
import MailSalesContent from "@/components/MailSalesContent";
import TaskContent from "@/components/TaskContent";
import { createClient } from "@/utils/supabase/client";
import type { Session } from "@auth/core/types";
import { useEffect, useState } from "react";
import { BsClock } from "react-icons/bs";
import { BsGrid } from "react-icons/bs";
import { BsInbox } from "react-icons/bs";
import { BsEnvelopeArrowUp } from "react-icons/bs";
import { BsCardChecklist } from "react-icons/bs";

type ContentKey = "dashboard" | "attendance" | "task" | "inbox" | "mailSales";

interface SessionProps {
    session: Session | null;
}

export default function Home({ session }: SessionProps) {

    // 現在選択中のコンテンツを state で保持
    const [activeContent, setActiveContent] = useState<ContentKey>("dashboard");

    const renderContent = () => {
        switch (activeContent) {
            case "dashboard":
                return <DashboardContent />;
            case "attendance":
                return <AttendanceContent session={session} />;
            case "task":
                return <TaskContent />;
            case "inbox":
                return <InboxContent />;
            case "mailSales":
                return <MailSalesContent />;
            default:
                return <DashboardContent />;
        }
    };

    useEffect(() => {
        const registerUserIfNew = async () => {
            if (!session?.user?.email) return;

            const supabase = createClient();
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("email", session.user.email)
                .maybeSingle();

            if (!data && !error) {
                await supabase.from("users").insert({
                    name: session.user.name,
                    email: session.user.email,
                });
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
                                    <span className="text-gray-700">打刻管理</span>
                                </li>
                                <li
                                    onClick={() => setActiveContent("task")}
                                    className={`flex gap-2 items-center px-2 py-1 rounded-md cursor-pointer transition-colors duration-200 ${activeContent === "task" ? "bg-gray-200" : ""
                                        }`}
                                >
                                    <BsCardChecklist className="text-xl" />
                                    <span className="text-gray-700">タスク管理</span>
                                </li>
                            </ul>
                        </div>

                        {/* グループ3: メール */}
                        <div>
                            <h3 className="uppercase text-md font-semibold mb-2">メール</h3>
                            <ul className="flex flex-col space-y-1">
                                <li
                                    onClick={() => setActiveContent("inbox")}
                                    className={`flex gap-2 items-center px-2 py-1 rounded-md cursor-pointer transition-colors duration-200 ${activeContent === "inbox" ? "bg-gray-200" : ""
                                        }`}
                                >
                                    <BsInbox className="text-xl" />
                                    <span className="text-gray-700">受信ボックス</span>
                                </li>
                                <li
                                    onClick={() => setActiveContent("mailSales")}
                                    className={`flex gap-2 items-center px-2 py-1 rounded-md cursor-pointer transition-colors duration-200 ${activeContent === "mailSales" ? "bg-gray-200" : ""
                                        }`}
                                >
                                    <BsEnvelopeArrowUp className="text-xl" />
                                    <span className="text-gray-700">メール営業</span>
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
