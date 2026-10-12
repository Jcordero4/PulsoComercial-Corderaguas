import type { NextAuthConfig } from "next-auth";

export type AppRole = "VENDEDOR" | "GERENTE";

// Config sin acceso a BD: la usa el proxy para chequeos optimistas.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const role = auth?.user?.role;
      if (path.startsWith("/login")) {
        // Solo se redirige la navegación (GET). Redirigir el POST de una server action
        // produce "unexpected response from the server" en el navegador.
        if (request.method !== "GET") return true;
        return role ? Response.redirect(new URL("/", request.nextUrl)) : true;
      }
      if (!auth?.user) return false;
      if (path.startsWith("/gerente") && role !== "GERENTE") {
        return Response.redirect(new URL("/vendedor", request.nextUrl));
      }
      if (path.startsWith("/vendedor") && role !== "VENDEDOR") {
        return Response.redirect(new URL("/gerente", request.nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as AppRole;
      return session;
    },
  },
} satisfies NextAuthConfig;
