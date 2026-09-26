import { isValidCpf, onlyDigits } from "@/lib/br-documents";
import {
  isOngReadyForReview,
  TERMS_VERSION,
  type OngProfile,
  type TermsAcceptance,
} from "@/lib/ong";
import { findUserById, SESSION_COOKIE, updateOngProfile } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * PUT /api/ong/profile
 * Body: { profile: OngProfile, submitForReview?: boolean }
 *
 * O client manda o perfil inteiro; o servidor preserva o que o usuário não
 * pode mudar (documento, status de verificação, aceite original dos termos)
 * e carimba IP/data em consentimentos novos.
 */

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "desconhecido"
  );
}

export async function PUT(request: Request) {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user || user.role !== "ong" || !user.ong) {
    return NextResponse.json(
      { message: "Faça login com uma conta de ONG." },
      { status: 401 },
    );
  }

  const body = (await request.json()) as {
    profile?: OngProfile;
    submitForReview?: boolean;
  };

  const incoming = body.profile;
  if (!incoming || typeof incoming !== "object") {
    return NextResponse.json({ message: "Perfil inválido." }, { status: 400 });
  }

  const stored = user.ong;
  const representativeCpf = onlyDigits(incoming.representative?.cpf ?? "");

  if (representativeCpf && !isValidCpf(representativeCpf)) {
    return NextResponse.json(
      { message: "CPF do responsável inválido.", field: "representative.cpf" },
      { status: 400 },
    );
  }

  const stamp = (): TermsAcceptance => ({
    version: TERMS_VERSION,
    acceptedAt: new Date().toISOString(),
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? "",
  });

  const merged: OngProfile = {
    ...incoming,
    legal: {
      ...incoming.legal,
      organizationType: stored.legal.organizationType,
      documentType: stored.legal.documentType,
      document: stored.legal.document,
      receitaStatus: stored.legal.receitaStatus,
      tradeName: incoming.legal.tradeName?.trim() || stored.legal.tradeName,
    },
    representative: {
      ...incoming.representative,
      cpf: representativeCpf,
      phone: onlyDigits(incoming.representative?.phone ?? ""),
      // Verificação por código fica para o backend.
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
      adoptersDataConsent: incoming.legalConsent?.adoptersDataConsent
        ? (stored.legalConsent.adoptersDataConsent ?? stamp())
        : null,
    },
  };

  if (body.submitForReview) {
    if (!isOngReadyForReview(merged)) {
      return NextResponse.json(
        { message: "Complete todos os itens do checklist antes de enviar." },
        { status: 400 },
      );
    }
    if (merged.verification.status === "pendente") {
      merged.verification.status = "em_analise";
      merged.verification.statusUpdatedAt = new Date().toISOString();
    }
  }

  const updated = await updateOngProfile(user.id, merged);

  return NextResponse.json({ profile: updated?.ong });
}
