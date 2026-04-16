import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import db, { initDB } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      await initDB();

      const userId = user.id ?? "";
      const email = user.email ?? null;
      const name = user.name ?? null;
      const image = user.image ?? null;

      const existing = await db.execute({
        sql: "SELECT id FROM families WHERE google_id = ?",
        args: [userId],
      });

      if (existing.rows.length === 0) {
        await db.execute({
          sql: "INSERT INTO families (id, google_id, email, name, avatar) VALUES (?, ?, ?, ?, ?)",
          args: [userId, userId, email, name, image],
        });
      } else {
        await db.execute({
          sql: "UPDATE families SET email = ?, name = ?, avatar = ? WHERE google_id = ?",
          args: [email, name, image, userId],
        });
      }

      return true;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
