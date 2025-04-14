"use client"
import { signIn } from "@/app/lib/auth";
import { useRouter } from "next/navigation";


export default function Home() {
  const router = useRouter();
  const toLogin = () => {
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-8">
      <h1 className="text-4xl font-bold mb-8">ROLEE</h1>
        <button
          onClick={toLogin}
          className="flex items-center gap-3 bg-white border border-gray-300 hover:shadow-lg rounded-md px-4 py-2 transition-shadow"
        >
          <span className="text-lg">ログイン</span>
        </button>
    </div>
  );
}
