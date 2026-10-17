import { isAdopterReadyForReview, type AdopterProfile } from "@/lib/adopter";
import { isValidPersonalTaxId, onlyDigits } from "@/lib/br-documents";
import { TERMS_VERSION, type TermsAcceptance } from "@/lib/ngo";
import {
  findUserById,
  SESSION_COOKIE,
  updateAdopterProfile,
} from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Update the adopter profile. Preserve verification status and original terms acceptance; timestamp new consent records on the server. */

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function PUT(request: Request) {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user || user.role !== "adopter" || !user.adopter) {
    return NextResponse.json(
      { message: "Faça login com uma conta de adotante." },
      { status: 401 },
    );
  }

  const body = (await request.json()) as {
    profile?: AdopterProfile;
    submitForReview?: boolean;
  };

  const incoming = body.profile;
  if (!incoming || typeof incoming !== "object") {
    return NextResponse.json({ message: "Perfil inválido." }, { status: 400 });
  }

  const stored = user.adopter;
  const personalTaxId = onlyDigits(incoming.personal?.personalTaxId ?? "");

  if (personalTaxId && !isValidPersonalTaxId(personalTaxId)) {
    return NextResponse.json(
      { message: "CPF inválido.", field: "personal.personalTaxId" },
      { status: 400 },
    );
  }

  const stamp = (): TermsAcceptance => ({
    version: TERMS_VERSION,
    acceptedAt: new Date().toISOString(),
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? "",
  });

  const merged: AdopterProfile = {
    ...incoming,
    personal: {
      ...incoming.personal,
      personalTaxId,
      phone: onlyDigits(incoming.personal?.phone ?? ""),
      // Code-based verification requires a backend integration.
      phoneVerifiedAt: stored.personal.phoneVerifiedAt,
    },
    verification: {
      ...incoming.verification,
      status: stored.verification.status,
      statusUpdatedAt: stored.verification.statusUpdatedAt,
      statusNote: stored.verification.statusNote,
    },
    legalConsent: {
      terms: incoming.legalConsent?.terms
        ? (stored.legalConsent.terms ?? stamp())
        : null,
    },
  };

  if (body.submitForReview) {
    if (!isAdopterReadyForReview(merged)) {
      return NextResponse.json(
        { message: "Complete todos os itens do checklist antes de enviar." },
        { status: 400 },
      );
    }
    if (merged.verification.status === "pending") {
      merged.verification.status = "under_review";
      merged.verification.statusUpdatedAt = new Date().toISOString();
    }
  }

  const updated = await updateAdopterProfile(user.id, merged);

  return NextResponse.json({ profile: updated?.adopter });
}
