import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username) {
          return null;
        }

        const input = (credentials.username as string).trim();

        // Try username first (teachers/researchers), then display name (students)
        let user = await prisma.user.findUnique({
          where: { username: input },
        });

        if (!user) {
          // Students log in by display name — case-insensitive match
          user = await prisma.user.findFirst({
            where: {
              displayName: { equals: input, mode: "insensitive" },
              role: "student",
            },
          });
        }

        if (!user) {
          return null;
        }

        // Students log in by name only — no password required
        if (user.role === "student") {
          return { id: user.id, name: user.displayName, role: user.role };
        }

        // Teachers and researchers require a password
        if (!credentials?.password) {
          return null;
        }
        if (!user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.displayName,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
});
