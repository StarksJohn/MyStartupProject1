import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      hasPurchase: boolean;
      activeProgramId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    hasPurchase?: boolean;
    activeProgramId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    email?: string | null;
    hasPurchase?: boolean;
    activeProgramId?: string | null;
  }
}
