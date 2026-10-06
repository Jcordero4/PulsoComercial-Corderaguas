import { Nav } from "@/components/Nav";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <Nav name={user.name} role={user.role} />
      <div className="mx-auto max-w-5xl p-4">{children}</div>
    </>
  );
}
