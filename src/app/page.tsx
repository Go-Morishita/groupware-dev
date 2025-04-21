import Image from "next/image";
import { FcGoogle } from "react-icons/fc";
import { signIn } from "@/app/lib/auth";

export default function Home() {

  return (
    <div className="min-h-screen bg-[#1869db] flex flex-col">
      {/* ヘッダー */}
      <header className="w-full bg-white shadow-md py-3 px-40 flex items-center gap-2">
        <Image
          src="/images/logo_1.png"
          alt="ROLEEイメージ"
          width={35}
          height={35}
          className="relative top-0.5"
        />
        <h1 className="text-3xl font-bold">ROLEE</h1>
      </header>

      {/* メインコンテンツ */}
      <main className="flex flex-1 flex-col md:flex-row items-center justify-between px-40 py-20 gap-8">
        {/* テキスト側 */}
        <div className="text-white max-w-xl">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4">業務効率化ならROLEE</h1>
          <p className="text-lg mb-8">
            日本発、チームの連携を加速する、<br className="sm:hidden" />
            シンプルでパワフルな業務効率化グループウェア
          </p>
          <div className="flex gap-6">
            <button
              className="flex items-center gap-3 bg-[#fca800] border border-[#fca800] hover:shadow-lg rounded-md px-6 py-2 text-lg transition-shadow font-medium text-[#172b4d]"
            >
              導入お問い合わせ
            </button>
            <button
              onClick={async () => {
                "use server";
                await signIn("google", { redirectTo: "/home" });
              }}
              className="flex items-center gap-3 bg-white border border-gray-300 hover:shadow-lg rounded-md px-6 py-2 text-lg transition-shadow font-medium text-[#172b4d]"
            >
              <FcGoogle size={24} />
              <span className="text-lg text-black">Google</span>
            </button>
          </div>
        </div>

        {/* 画像側 */}
        <div className="w-full md:w-1/2 max-w-xl">
          <Image
            src="/images/test.webp"
            alt="ROLEEイメージ"
            width={900}
            height={900}
            className="w-full h-auto object-contain"
          />
        </div>
      </main>

      <footer className="w-full py-4 px-40 bg-[#1869db]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-sm text-white">
          {/* コピーライト */}
          <span>
            &copy; 2014 - {new Date().getFullYear()} ROLEE Inc. All rights reserved.
          </span>

          {/* 運営会社リンク */}
          <a
            href="https://www.rolee.co.jp/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 md:mt-0 hover:underline"
          >
            ROLEE Inc.
          </a>
        </div>
      </footer>



    </div>
  );
}
