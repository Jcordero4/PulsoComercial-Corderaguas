import { requireUser } from "@/lib/session";

export default async function Page() {
  await requireUser("GERENTE");
  return (
    <main className="space-y-2">
      <h1 className="text-2xl font-semibold">Panel del gerente</h1>
      <p className="text-sm text-slate-500">Los indicadores y gráficas llegan en la Etapa 4.</p>
    </main>
  );
}
