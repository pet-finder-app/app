import { isValidPersonalTaxId, onlyDigits } from "@/lib/br-documents";
import {
  isNgoReadyForReview,
  TERMS_VERSION,
  type NgoProfile,
  type TermsAcceptance,
} from "@/lib/ngo";
import { findUserById, SESSION_COOKIE, updateNgoProfile } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Update the NGO profile while preserving document identity, verification status, and original consent. Timestamp new consent on the server. */

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

  if (!user || user.role !== "ngo" || !user.ngo) {
    return NextResponse.json(
      { message: "Faça login com uma conta de ONG." },
      { status: 401 },
    );
  }

  const body = (await request.json()) as {
    profile?: NgoProfile;
    submitForReview?: boolean;
  };

  const incoming = body.profile;
  if (!incoming || typeof incoming !== "object") {
    return NextResponse.json({ message: "Perfil inválido." }, { status: 400 });
  }

  const stored = user.ngo;
  const representativePersonalTaxId = onlyDigits(
    incoming.representative?.personalTaxId ?? "",
  );

  if (
    representativePersonalTaxId &&
    !isValidPersonalTaxId(representativePersonalTaxId)
  ) {
    return NextResponse.json(
      {
        message: "CPF do responsável inválido.",
        field: "representative.personalTaxId",
      },
      { status: 400 },
    );
  }

  const stamp = (): TermsAcceptance => ({
    version: TERMS_VERSION,
    acceptedAt: new Date().toISOString(),
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? "",
  });

  const merged: NgoProfile = {
    ...incoming,
    legal: {
      ...incoming.legal,
      organizationType: stored.legal.organizationType,
      documentType: stored.legal.documentType,
      document: stored.legal.document,
      taxRegistryStatus: stored.legal.taxRegistryStatus,
      tradeName: incoming.legal.tradeName?.trim() || stored.legal.tradeName,
    },
    representative: {
      ...incoming.representative,
      personalTaxId: representativePersonalTaxId,
      phone: onlyDigits(incoming.representative?.phone ?? ""),
      // Code-based verification requires a backend integration.
      emailVerifiedAt: stored.representative.emailVerifiedAt,
      phoneVerifiedAt: stored.representative.phoneVerifiedAt,
    },
    verification: {
      ...incoming.verification,
      status: stored.verification.status,
      statusUpdatedAt: stored.verification.statusUpdatedAt,
      statusNote: stored.verification.statusNote,
    },
    legalConsent: {
      ...incoming.legalConsent,
      terms: stored.legalConsent.terms,
      representativeAuthorization:
        stored.legalConsent.representativeAuthorization ?? null,
      adoptersDataConsent: incoming.legalConsent?.adoptersDataConsent
        ? (stored.legalConsent.adoptersDataConsent ?? stamp())
        : null,
    },
  };

  if (body.submitForReview) {
    if (!isNgoReadyForReview(merged)) {
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

  const updated = await updateNgoProfile(user.id, merged);

  return NextResponse.json({ profile: updated?.ngo });
}
