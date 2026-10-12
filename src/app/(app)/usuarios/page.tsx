import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDateTime } from "@/lib/labels";
import { isLocked } from "@/lib/lockout";
import { setUserActive, unlockUser } from "./actions";
import { CreateUserForm, ResetPasswordForm } from "./UserForms";

export default async function UsuariosPage() {
  const me = await requireUser("GERENTE");
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, active: true, lockedUntil: true },
  });
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Vendedores y usuarios</h1>
      <section className="space-y-2">
        <h2 className="font-medium">Nuevo usuario</h2>
        <CreateUserForm />
      </section>
      <table className="w-full text-sm">
        <thead className="text-left text-slate-500">
          <tr>
            <th className="py-2">Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Estado</th>
            <th />
            <th />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t align-middle">
              <td className="py-2">{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role === "GERENTE" ? "Gerente" : "Vendedor"}</td>
              <td>
                {!u.active ? "Inactivo" : isLocked(u.lockedUntil) ? (
                  <span>
                    <span aria-hidden className="text-[var(--st-serious)]">▲ </span>
                    Bloqueado hasta {formatDateTime(u.lockedUntil!)}
                  </span>
                ) : (
                  "Activo"
                )}
              </td>
              <td className="space-x-3 whitespace-nowrap">
                {isLocked(u.lockedUntil) && (
                  <form action={unlockUser.bind(null, u.id)} className="inline">
                    <button className="underline">Desbloquear</button>
                  </form>
                )}
                {u.id !== me.id && (
                  <form action={setUserActive.bind(null, u.id, !u.active)}>
                    <button className="underline">{u.active ? "Desactivar" : "Activar"}</button>
                  </form>
                )}
              </td>
              <td>
                <ResetPasswordForm userId={u.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
