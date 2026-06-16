import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // Check admin
        if (user.email === 'ungnhutkhang53@gmail.com') {
          (session.user as any).role = 'admin';
        } else {
          (session.user as any).role = 'user';
        }
      }
      return session;
    },
  },
})
