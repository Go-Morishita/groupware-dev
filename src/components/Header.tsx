"use client";

import Image from "next/image";
import type { Session } from "@auth/core/types";

type HeaderProps = {
  session: Session | null;
};

export default function Header({ session }: HeaderProps) {
  return (
    <header className="py-2 ps-4 pe-2 flex justify-between items-center shadow border-b border-gray-200">
      <h1 className="text-xl font-semibold">ROLEE</h1>
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
    </header>
  );
}
