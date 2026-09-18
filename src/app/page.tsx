import { SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function App() {
  const session = (await cookies()).get(SESSION_COOKIE);

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-neutral-100">
      <p className="text-sm text-neutral-500">Conteúdo principal</p>
    </main>
  );
}
