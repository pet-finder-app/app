import {
  DONATION_MAX_NOTE_LENGTH,
  validateDonationAmount,
} from "@/lib/donation";
import { createDonation, getDonationTarget } from "@/lib/donations";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Record a direct Pix donation to an NGO. The app never transfers funds; the NGO confirms receipt against its bank statement. */
export async function POST(request: Request) {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;
  if (!user || user.role !== "adopter" || !user.adopter) {
    return NextResponse.json(
      { message: "Faça login com uma conta de adotante." },
      { status: 401 },
    );
  }

  const body = (await request.json()) as {
    ngoId?: string;
    amount?: number;
    anonymous?: boolean;
    note?: string;
  };
  const target = body.ngoId ? await getDonationTarget(body.ngoId) : undefined;
  if (!target) {
    return NextResponse.json(
      { message: "ONG não encontrada." },
      { status: 404 },
    );
  }
  if (!target.pixKey && !target.bankAccount) {
    return NextResponse.json(
      { message: "Esta ONG ainda não cadastrou uma forma de receber doações." },
      { status: 409 },
    );
  }

  const amount = Number(body.amount);
  const amountError = validateDonationAmount(amount);
  if (amountError) {
    return NextResponse.json({ message: amountError }, { status: 400 });
  }

  const note = (body.note ?? "").trim().slice(0, DONATION_MAX_NOTE_LENGTH);
  const donation = await createDonation({
    ngoId: target.ngoId,
    donorId: user.id,
    donorName: body.anonymous
      ? "Anônimo"
      : user.adopter.personal.fullName || user.name,
    amount: Math.round(amount * 100) / 100,
    note,
  });
  return NextResponse.json({ donation }, { status: 201 });
}
