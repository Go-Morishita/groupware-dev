// app/page.jsx (または app/page.tsx)
import { auth } from "@/app/lib/auth";
import Home from "../../components/layout/Home/Home";

export default async function HomePage() {
    // サーバー側でセッション情報を取得
    const session = await auth();

    return <Home session={session} />;
}
