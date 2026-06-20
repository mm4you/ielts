import { auth } from "@/auth";

export default auth((req) => {
  const reqUrl = new URL(req.url);
  
  // Xác định các đường dẫn admin hoặc các API gieo hạt, di trú dữ liệu nhạy cảm
  const isAdminPath = reqUrl.pathname.startsWith("/admin");
  const isAdminApiPath = 
    reqUrl.pathname.startsWith("/api/admin") ||
    reqUrl.pathname === "/api/seed-more" ||
    reqUrl.pathname === "/api/seed-basic" ||
    reqUrl.pathname === "/api/seed-cambridge" ||
    reqUrl.pathname === "/api/migrate-db" ||
    reqUrl.pathname === "/api/migrate-pos-datamuse";

  if (isAdminPath || isAdminApiPath) {
    const isAuthorized = req.auth && (req.auth.user as any)?.role === "admin";
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
  ],
};
