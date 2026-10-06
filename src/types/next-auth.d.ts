import type { AppRole } from "@/auth.config";

declare module "next-auth" {
  interface User {
    role?: AppRole;
  }
  interface Session {
    user: { id: string; role: AppRole; name?: string | null; email?: string | null };
  }
}
