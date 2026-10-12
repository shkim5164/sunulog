import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    isAdmin: boolean;
    user?: DefaultSession["user"] & { id?: string };
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    githubId?: string;
  }
}
