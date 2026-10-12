import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

// Tell TypeScript about the extra fields we put on the user, session and token in auth.config.ts.
declare module "next-auth" {
  interface User {
    role: Role;
  }

  interface Session {
    user: { id: string; role: Role } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
