"use client";

import Image from "next/image";
import type { Session } from "@auth/core/types";
import { useEffect, useState } from "react";

type HeaderProps = {
  session: Session | null;
};

export default function Header({ session }: HeaderProps) {

  const [activeUsers, setActiveUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUserDate = async () => {
      try {
        const res = await fetch(`/api/users?active=true`);
        const data = await res.json();

        if (data.error) {
          console.error('取得エラー:', data[0].id);
          return;
        }

        setActiveUsers(data);
      } catch (err) {
        console.log('通信エラー: ', err);
      }
    }

    fetchUserDate();
  }, [])

  return (
    <header className="py-2 ps-4 pe-2 flex justify-between items-center shadow border-b border-gray-200">
      <h1 className="text-xl font-semibold">ROLEE</h1>
      <div className="flex gap-2">
        <div className="flex items-center -space-x-1">
          {activeUsers && activeUsers.filter(user => user.email !== session?.user?.email).map(activeUser => (
            <div className="relative" key={activeUser.id}>
              <Image
                src={activeUser.image}
                alt="ユーザーアイコン"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
          ))}
        </div>
        {session && (
          <>
            {session.user?.image && (
              <Image
                src={session.user.image}
                alt="ユーザーアイコン"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full"
              />
            )}
          </>
        )}
      </div>
    </header>
  );
}
