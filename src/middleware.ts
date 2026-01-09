
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isOnDashboard = req.nextUrl.pathname.startsWith("/tasks") ||
        req.nextUrl.pathname === "/" ||
        req.nextUrl.pathname.startsWith("/goals") ||
        req.nextUrl.pathname.startsWith("/projects") ||
        // Add other protected routes here
        req.nextUrl.pathname.startsWith("/api/tasks") ||
        req.nextUrl.pathname.startsWith("/api/goals")

    const isAuthPage = req.nextUrl.pathname.startsWith("/login") ||
        req.nextUrl.pathname.startsWith("/signup")

    if (isOnDashboard) {
        if (isLoggedIn) return
        return NextResponse.redirect(new URL("/login", req.nextUrl))
    }

    if (isAuthPage) {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL("/", req.nextUrl))
        }
        return
    }
})

export const config = {
    matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
