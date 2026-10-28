import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
  pages: { signIn: '/', error: '/' },
  session: { strategy: "jwt" },
  providers: [
    Google,
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.identityVersion = 2;
        token.id = user.id;
        token.role = (user as typeof user & { role?: string }).role || 'user';
      }
      if (token.identityVersion !== 2) return null;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as typeof session.user & { role: string }).role = token.role as string;
        
        // Kiểm tra quyền admin theo email
        if (session.user.email === 'ungnhutkhang53@gmail.com') {
          (session.user as typeof session.user & { role: string }).role = 'admin';
        }
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
