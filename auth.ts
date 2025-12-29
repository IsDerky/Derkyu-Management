import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ account }) {
      // Verificar si el usuario está autorizado
      const allowedDiscordId = process.env.ALLOWED_DISCORD_ID

      if (account?.provider === "discord" && allowedDiscordId) {
        // Verificar por Discord ID
        if (account.providerAccountId !== allowedDiscordId) {
          // Rechazar el login completamente
          return false
        }
      }

      return true
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/unauthorized",
  },
})
