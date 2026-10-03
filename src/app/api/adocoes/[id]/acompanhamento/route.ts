import { toClientAdoption } from "@/lib/adoption";
import { performAction } from "@/lib/adoptions";
import { MAX_IMAGE_BYTES, POST_MIME_EXTENSION } from "@/lib/post";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

const UPLOAD_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "acompanhamento",
);

/**
 * POST /api/adocoes/[id]/acompanhamento — o adotante manda o relato de
 * acompanhamento (texto e, se quiser, uma foto). Multipart:
 * followUpId, note, photo?.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;
  if (!user || user.role !== "adopter") {
    return NextResponse.json({ message: "Faça login." }, { status: 401 });
  }

  const form = await request.formData();
  const followUpId = String(form.get("followUpId") ?? "");
  const note = String(form.get("note") ?? "");
  const photo = form.get("photo");

  if (!note.trim()) {
    return NextResponse.json(
      { message: "Conte como o pet está." },
      { status: 400 },
    );
  }

  let photoUrl: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    const extension = POST_MIME_EXTENSION[photo.type];
    if (!extension || !photo.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "Mande uma foto em JPG, PNG ou WebP." },
        { status: 400 },
      );
    }
    if (photo.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { message: "A foto passou de 10 MB. Mande uma menor." },
        { status: 400 },
      );
    }
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const fileName = `${crypto.randomUUID()}${extension}`;
    await fs.writeFile(
      path.join(UPLOAD_DIR, fileName),
      Buffer.from(await photo.arrayBuffer()),
    );
    photoUrl = `/uploads/acompanhamento/${fileName}`;
  }

  const result = await performAction(
    id,
    { id: user.id, role: "adopter", ip: "", userAgent: "" },
    { action: "followup", followUpId, note, photoUrl },
  );
  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status },
    );
  }
  return NextResponse.json({ adoption: toClientAdoption(result.adoption) });
}
