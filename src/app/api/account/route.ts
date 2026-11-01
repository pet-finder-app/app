import { deleteDislikesOfUser } from "@/lib/dislikes";
import { deleteFollowsOfUser } from "@/lib/follows";
import { deleteNotificationsOfUser } from "@/lib/notifications";
import { deletePetsByNgo } from "@/lib/pets";
import { deletePostLikesOfUser } from "@/lib/post-likes";
import { deletePostsByNgo } from "@/lib/posts";
import { deleteUser, findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Delete the authenticated account and its published content and preferences. Retain conversations and signed adoption records for legal retention requirements. */
export async function DELETE() {
  const store = await cookies();
  const session = store.get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;
  if (!user) {
    return NextResponse.json({ message: "Faça login." }, { status: 401 });
  }

  if (user.role === "ngo") {
    await Promise.all([deletePetsByNgo(user.id), deletePostsByNgo(user.id)]);
  } else {
    await Promise.all([
      deleteDislikesOfUser(user.id),
      deletePostLikesOfUser(user.id),
    ]);
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
