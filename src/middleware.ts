/* ミドルウェア（認証やCORSなど）*/
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    // 保護対象のルート（API やダッシュボードページなど）
    const protectedPaths = ["/home", "/api/tasks", "/api/stamps", "/api/users"];

    const { pathname } = request.nextUrl;
    // 現在のパスが保護対象か判定
    const isProtectedRoute = protectedPaths.some((path) => pathname.startsWith(path));

    if (isProtectedRoute) {
        // ローカル環境用
        const token = request.cookies.get("authjs.session-token")?.value
        // http環境用
        // let token = request.cookies.get("__Secure-authjs.session-token")?.value;
        if (!token) {
            // 認証用トークンが存在しない場合、ログイン画面へリダイレクト
            const loginUrl = new URL("/login", request.url);
            return NextResponse.redirect(loginUrl);
        }
    }
    return NextResponse.next();
}

// どのパスに対して middleware を適用するかを指定
export const config = {
    matcher: ['/home/:path*', '/api/tasks/:path*', '/api/stamps/:path*', '/api/users/:path*'],
};