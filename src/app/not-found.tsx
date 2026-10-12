import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className="max-w-sm space-y-4 rounded-xl bg-white p-6 text-center shadow">
        <h1 className="text-xl font-semibold">Página no encontrada</h1>
        <p className="text-sm text-slate-600">La página que buscas no existe o fue movida.</p>
        <Link href="/" className="inline-block rounded bg-slate-900 px-4 py-2 text-white">
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
