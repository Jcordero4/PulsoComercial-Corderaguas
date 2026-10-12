"use client";

import Link from "next/link";
import { useEffect } from "react";

// Si algo falla al renderizar una página, se muestra este mensaje en vez de una pantalla rota.
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className="max-w-sm space-y-4 rounded-xl bg-white p-6 text-center shadow">
        <h1 className="text-xl font-semibold">Algo salió mal</h1>
        <p className="text-sm text-slate-600">
          No pudimos completar la acción. Intenta de nuevo; si el problema sigue, avisa a gerencia.
        </p>
        <div className="flex justify-center gap-3">
          <button onClick={() => retry()} className="rounded bg-slate-900 px-4 py-2 text-white">
            Reintentar
          </button>
          <Link href="/" className="rounded border border-slate-300 px-4 py-2">
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
