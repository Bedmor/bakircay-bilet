import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Resend from "next-auth/providers/resend";

import { env } from "~/env";

import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "USER" | "ADMIN";
      phone?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "USER" | "ADMIN";
    phone?: string | null;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    Resend({
      apiKey: env.AUTH_RESEND_API_KEY,
      from: env.AUTH_EMAIL_FROM,
    }),
  ],
  adapter: (() => {
    const adapter = PrismaAdapter(db);

    return {
      ...adapter,
      deleteSession: async (sessionToken) => {
        await db.session.deleteMany({ where: { sessionToken } });
        return null;
      },
    };
  })(),
  session: {
    strategy: "database",
  },
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
        role: user.role ?? "USER",
        phone: user.phone,
      },
    }),
  },
} satisfies NextAuthConfig;
