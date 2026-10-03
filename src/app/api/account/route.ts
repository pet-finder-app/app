import { deleteDislikesOfUser } from "@/lib/dislikes";
import { deleteFollowsOfUser } from "@/lib/follows";
import { deleteNotificationsOfUser } from "@/lib/notifications";
import { deletePetsByOng } from "@/lib/pets";
import { deletePostsByOng } from "@/lib/posts";
import { deleteUser, findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * DELETE /api/account — o usuário logado exclui a própria conta (LGPD). Apaga
 * o cadastro e o que ele publicou ou marcou. Conversas e adoções já feitas
 * ficam, porque o termo assinado precisa ser guardado por obrigação legal.
 */
export async function DELETE() {
  const store = await cookies();
  const session = store.get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;
  if (!user) {
    return NextResponse.json({ message: "Faça login." }, { status: 401 });
  }

  if (user.role === "ong") {
    await Promise.all([deletePetsByOng(user.id), deletePostsByOng(user.id)]);
  } else {
    await deleteDislikesOfUser(user.id);
  }
  await Promise.all([
    deleteNotificationsOfUser(user.id),
    deleteFollowsOfUser(user.id),
  ]);
  await deleteUser(user.id);

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
