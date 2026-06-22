import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const reqUrl = new URL(req.url);
  const isAuthenticated = !!req.auth;
  
  // 1. Xác định các đường dẫn admin hoặc các API gieo hạt, di trú dữ liệu nhạy cảm
  const isAdminPath = reqUrl.pathname.startsWith("/admin");
  const isAdminApiPath = 
    reqUrl.pathname.startsWith("/api/admin") ||
    reqUrl.pathname === "/api/seed-more" ||
    reqUrl.pathname === "/api/seed-basic" ||
    reqUrl.pathname === "/api/seed-cambridge" ||
    reqUrl.pathname === "/api/migrate-db" ||
    reqUrl.pathname === "/api/migrate-pos-datamuse";

  if (isAdminPath || isAdminApiPath) {
    const isAuthorized = isAuthenticated && (req.auth?.user as any)?.role === "admin";
    if (!isAuthorized) {
      if (isAdminApiPath) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      return Response.redirect(new URL("/", req.url));
    }
  }

  // 2. Xác định các đường dẫn protected cần đăng nhập
  const isProtectedPath = 
    reqUrl.pathname.startsWith("/library") ||
    reqUrl.pathname.startsWith("/collections") ||
    reqUrl.pathname.startsWith("/review") ||
    reqUrl.pathname.startsWith("/analytics") ||
    reqUrl.pathname.startsWith("/match") ||
    reqUrl.pathname.startsWith("/speedrun") ||
    reqUrl.pathname.startsWith("/blockblast") ||
    reqUrl.pathname.startsWith("/sniper") ||
    reqUrl.pathname.startsWith("/pronounce-challenge") ||
    reqUrl.pathname.startsWith("/word");

  if (isProtectedPath && !isAuthenticated) {
    // Redirect về trang chủ bằng 307 (mặc định của Response.redirect)
    return Response.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/seed-more",
    "/api/seed-basic",
    "/api/seed-cambridge",
    "/api/migrate-db",
    "/api/migrate-pos-datamuse",
    // Protected routes
    "/library/:path*",
    "/collections/:path*",
    "/review/:path*",
    "/analytics/:path*",
    "/match/:path*",
    "/speedrun/:path*",
    "/blockblast/:path*",
    "/sniper/:path*",
    "/pronounce-challenge/:path*",
    "/word/:path*",
  ],
};
