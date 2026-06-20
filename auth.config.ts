import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
  session: { strategy: "jwt" },
  providers: [
    Google,
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'user';
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
        
        // Kiểm tra quyền admin theo email
        if (session.user.email === 'ungnhutkhang53@gmail.com') {
          (session.user as any).role = 'admin';
        }
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
