'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/app/lib/utils/supabase/client';
import useLocalStorageState from 'use-local-storage-state';
import { nanoid } from 'nanoid';

const StampComponent = ({ session }: SessionProps) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    // 個別に打刻の状態を管理するために打刻ごとに一意のstamp_idを生成し, それをローカルストレージで管理する.
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
        const supabase = createClient();
        const id = nanoid();

        try {
            const time = new Date().toISOString()
            const { error } = await supabase.from("stamps").insert({
                stamp_id: id,
                clock_in: time,
                email: session?.user?.email
            });

            if (error) {
                console.error(error);
                alert("打刻時にエラーが発生しました。");
            } else {
                setStamp({ stamp_id: id, work_now: true });
            }

        } catch (err) {
            console.error(err);
            alert("通信エラーが発生しました。");
        }
    };

    const handleClockOut = async () => {
        const supabase = createClient();

        try {
            const { error } = await supabase.from("stamps").update({
                clock_out: new Date().toISOString()
            }).eq('stamp_id', stamp.stamp_id);

            if (error) {
                console.error(error);
                alert("打刻時にエラーが発生しました。");
            } else {
                setStamp({ stamp_id: "", work_now: false });
            }

        } catch (err) {
            console.error(err);
            alert("通信エラーが発生しました。");
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
