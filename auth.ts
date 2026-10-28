import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authPrisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { canRecoverGoogleOrphan, googleIdentityAllowed } from '@/lib/google-identity';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(authPrisma),
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile }): Promise<boolean | string> {
      if (account?.provider !== 'google') return true;
      const google = profile as { email?: string; email_verified?: boolean; sub?: string };
      const current = await auth();
      if (!google || !googleIdentityAllowed(google, account.providerAccountId, current?.user?.email)) return '/?error=GoogleAccountMismatch';
      const linked = await authPrisma.account.findUnique({ where: { provider_providerAccountId: { provider: 'google', providerAccountId: account.providerAccountId } }, select: { user: { select: { email: true } } } });
      if (linked) return linked.user.email.toLowerCase() === google.email!.toLowerCase() ? true : '/?error=GoogleAccountMismatch';
      const existing = await authPrisma.user.findUnique({ where: { email: google.email!.toLowerCase() }, select: { id: true, password: true, role: true, accounts: { select: { provider: true } }, _count: { select: { progress: true, collections: true } } } });
      if (existing && canRecoverGoogleOrphan(google.email!.toLowerCase(), existing)) {
        // Only repair empty profiles with no authentication method, after Google's
        // verified email and subject checks. Existing usable accounts never auto-link.
        await authPrisma.account.create({ data: { userId: existing.id, provider: 'google', providerAccountId: account.providerAccountId, type: account.type, access_token: account.access_token, refresh_token: account.refresh_token, expires_at: account.expires_at, token_type: account.token_type, scope: account.scope, id_token: account.id_token } });
      }
      return true;
    },
  },
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await authPrisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      }
    })
  ]
});
