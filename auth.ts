import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/database/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google" || !profile?.sub || !profile.email) return false;
      const picture = (profile as { picture?: string }).picture;
      const given = (profile as { given_name?: string }).given_name;
      await prisma.user.upsert({
        where: { googleId: profile.sub },
        update: { name: profile.name ?? "Visitante", avatarUrl: picture },
        create: {
          googleId: profile.sub,
          email: profile.email,
          name: profile.name ?? "Visitante",
          publicName: given ?? profile.name ?? "Visitante",
          avatarUrl: picture,
        },
      });
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account && profile?.sub) {
        const user = await prisma.user.findUnique({ where: { googleId: profile.sub } });
        token.uid = user?.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.uid === "string") session.user.id = token.uid;
      return session;
    },
  },
});
