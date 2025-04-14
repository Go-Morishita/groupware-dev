'use client';

import { useState, useEffect } from 'react';
import useLocalStorageState from 'use-local-storage-state';

const StampComponent = ({ session }: SessionProps) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    // 個別に打刻の状態を管理するために打刻ごとに一意のstamp_idを生成し, それをローカルストレージで管理する（メールアドレスをキーにする）.
    // keyにユーザのメールアドレスを含めることでアカウント変更をまたぐ打刻申請も可能に.
    const [stamp, setStamp] = useLocalStorageState<LocalStorageStamp>(
        `stamp:${session?.user?.email}`,
        {
            defaultValue: {
                stamp_id: '',
                work_now: false,
            },
        }
    );

    // 時刻の更新
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleClockIn = async () => {
        // 出勤処理: email 情報を用いて /api/stamps に clockIn のリクエストを送信
        try {
            const res = await fetch("/api/stamps", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action: "clockIn",
                    email: session?.user?.email,
                }),
            });
            const data = await res.json();

            if (data.error) {
                alert('出勤処理時にエラーが発生しました。');
            } else {
                setStamp({ stamp_id: data.stamp_id, work_now: true });
            }
        } catch (err: any) {
            console.error(err);
            alert('通信エラーが発生しました。');
        }
    };

    const handleClockOut = async () => {
        // 退勤処理: ローカルストレージに保存した　stamp_id を用いて /api/stamps に clockOut のリクエストの送信
        try {
            const res = await fetch("/api/stamps", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action: "clockOut",
                    stamp_id: stamp.stamp_id,
                }),
            });
            const data = await res.json();

            if (data.error) {
                alert('退勤処理時にエラーが発生しました。');
            } else {
                setStamp({ stamp_id: '', work_now: false });
            }
        } catch (err: any) {
            console.error(err);
            alert('通信エラーが発生しました。');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-60">
            <h1 className="text-7xl m-0 mb-2">{currentTime.toLocaleTimeString()}</h1>
            {stamp.work_now ? (<p className="text-xl">出勤中</p>) : (<p className="text-xl">未出勤</p>)}

            <div className="mt-4 flex space-x-4">
                <button
                    onClick={handleClockIn}
                    className="px-4 py-2 bg-blue-500 text-white rounded shadow-lg disabled:opacity-50"
                >
                    出勤
                </button>
                <button
                    onClick={handleClockOut}
                    className="px-4 py-2 bg-red-500 text-white rounded shadow-lg"
                >
                    退勤
                </button>
            </div>
        </div>
    );
};

export default StampComponent;
