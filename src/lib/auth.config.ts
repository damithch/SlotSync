import type { NextAuthConfig } from "next-auth";

// The part of the Auth.js config that needs no database or bcrypt.
// Kept separate so middleware (which can't use Prisma) can import it too.
export const authConfig = {
  pages: { signIn: "/login" },
  // Credentials login only works with JWT sessions: the session lives in a signed cookie, not a table.
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    // On sign in, copy the user's id and role into the token...
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    // ...and on every request, from the token into the session that pages and actions read.
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
