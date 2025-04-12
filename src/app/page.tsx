import { signIn } from "@/auth";
import { FcGoogle } from "react-icons/fc";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-8">
      <h1 className="text-4xl font-bold mb-8">ROLEE</h1>
      <button
        onClick={async () => {
          "use server";
          await signIn("google", { redirectTo: "/home" });
        }}
        className="flex items-center gap-3 bg-white border border-gray-300 hover:shadow-lg rounded-md px-4 py-2 transition-shadow"
      >
        <FcGoogle size={24} />
        <span className="text-lg">Sign in with Google</span>
      </button>
    </div>
  );
}
