"use client";

// Último recurso: falla en el layout raíz. Debe incluir su propio <html> y <body>.
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "sans-serif", display: "grid", placeContent: "center", minHeight: "100vh", textAlign: "center" }}>
        <h1>Algo salió mal</h1>
        <p>Intenta de nuevo en unos segundos.</p>
        <button onClick={() => retry()}>Reintentar</button>
      </body>
    </html>
  );
}
