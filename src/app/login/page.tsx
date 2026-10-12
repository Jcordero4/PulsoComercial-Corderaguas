import { LoginForm } from "./LoginForm";

const NOTICES: Record<string, string> = {
  bloqueado: "Tu sesión se cerró porque tu usuario fue desactivado. Contacta a gerencia.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const { aviso } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <LoginForm notice={aviso ? NOTICES[aviso] : undefined} />
    </main>
  );
}
