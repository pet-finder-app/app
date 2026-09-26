import { isAdopterReadyForReview, type AdopterProfile } from "@/lib/adopter";
import { isValidCpf, onlyDigits } from "@/lib/br-documents";
import { TERMS_VERSION, type TermsAcceptance } from "@/lib/ong";
import {
  findUserById,
  SESSION_COOKIE,
  updateAdopterProfile,
} from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * PUT /api/adopter/profile
 * Body: { profile: AdopterProfile, submitForReview?: boolean }
 *
 * O client manda o perfil inteiro; o servidor preserva o que o usuário não
 * pode mudar (status de verificação, aceite original dos termos) e carimba
 * IP/data em consentimentos novos.
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
  const cpf = onlyDigits(incoming.personal?.cpf ?? "");

  if (cpf && !isValidCpf(cpf)) {
    return NextResponse.json(
      { message: "CPF inválido.", field: "personal.cpf" },
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
      cpf,
      phone: onlyDigits(incoming.personal?.phone ?? ""),
      // Verificação por código fica para o backend.
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
    if (merged.verification.status === "pendente") {
      merged.verification.status = "em_analise";
      merged.verification.statusUpdatedAt = new Date().toISOString();
    }
  }

  const updated = await updateAdopterProfile(user.id, merged);

  return NextResponse.json({ profile: updated?.adopter });
}
