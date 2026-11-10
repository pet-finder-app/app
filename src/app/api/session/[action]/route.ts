import type { OrganizationResponse } from "@/lib/backend/contracts";
import {
  authSessionResponseSchema,
  organizationResponseSchema,
  userResponseSchema,
} from "@/lib/backend/contracts";
import {
  clearSessionCookies,
  isSameOrigin,
  selectedOrganization,
  setOrganizationCookie,
  setSessionCookies,
} from "@/lib/backend/session-cookies";
import {
  authenticatedBackendRequest,
  fetchBackend,
  refreshBackendSession,
} from "@/lib/backend/transport";
import { toWire } from "@/lib/backend/wire";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const credentialsSchema = z.object({ email: z.string(), password: z.string() });
const registrationSchema = credentialsSchema.extend({
  name: z.string(),
  acceptedTerms: z.boolean(),
  acceptedPrivacyPolicy: z.boolean(),
});
const organizationSelectionSchema = z.object({
  organizationId: z.string().uuid(),
});
const contextSchema = z.enum([
  "login",
  "register",
  "logout",
  "refresh",
  "organization",
  "me",
]);

async function handle(
  request: NextRequest,
  context: { params: Promise<{ action: string }> },
) {
  const parsedAction = contextSchema.safeParse((await context.params).action);
  if (!parsedAction.success)
    return NextResponse.json(
      { message: "Operação não encontrada." },
      { status: 404 },
    );
  const action = parsedAction.data;
  if ((action === "me") !== (request.method === "GET"))
    return NextResponse.json(
      { message: "Método não permitido." },
      { status: 405 },
    );
  if (request.method !== "GET" && !isSameOrigin(request))
    return NextResponse.json(
      { message: "Origem da solicitação inválida." },
      { status: 403 },
    );
  try {
    if (action === "login" || action === "register") {
      const input: unknown = await request.json();
      let wire: unknown;
      if (action === "register") {
        const parsed = registrationSchema.safeParse(input);
        if (!parsed.success)
          return NextResponse.json(
            { message: "Revise os dados de cadastro." },
            { status: 400 },
          );
        wire = {
          name: parsed.data.name,
          email: parsed.data.email,
          password: parsed.data.password,
          accepted_terms: parsed.data.acceptedTerms,
          accepted_privacy_policy: parsed.data.acceptedPrivacyPolicy,
        };
      } else {
        const parsed = credentialsSchema.safeParse(input);
        if (!parsed.success)
          return NextResponse.json(
            { message: "Revise os dados de acesso." },
            { status: 400 },
          );
        wire = parsed.data;
      }
      const upstream = await fetchBackend(`/v1/auth/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wire),
      });
      if (!upstream.ok)
        return new NextResponse(upstream.body, {
          status: upstream.status,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        });
      const data: unknown = await upstream.json();
      const tokens = authSessionResponseSchema.parse(data);
      const response = NextResponse.json(
        { user: toWire(tokens.user) },
        { status: upstream.status, headers: { "Cache-Control": "no-store" } },
      );
      setSessionCookies(response, tokens);
      return response;
    }
    const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
    if (action === "logout") {
      if (refreshToken) {
        const session = await authenticatedBackendRequest(
          "/v1/me",
          {},
          accessToken,
          refreshToken,
        );
        const response =
          session.response.status === 401
            ? session.response
            : await fetchBackend(
                "/v1/auth/logout",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    refresh_token: session.tokens?.refreshToken ?? refreshToken,
                  }),
                },
                session.tokens?.accessToken ?? accessToken,
              );
        const result = { response };
        if (!result.response.ok && result.response.status !== 401)
          return NextResponse.json(
            { message: "Não foi possível encerrar a sessão. Tente novamente." },
            { status: 503 },
          );
      }
      const response = NextResponse.json({ ok: true });
      clearSessionCookies(response);
      return response;
    }
    if (action === "refresh") {
      const tokens = refreshToken
        ? await refreshBackendSession(refreshToken)
        : null;
      if (!tokens) {
        const response = NextResponse.json(
          { message: "Entre novamente." },
          { status: 401 },
        );
        clearSessionCookies(response);
        return response;
      }
      const response = NextResponse.json({ user: toWire(tokens.user) });
      setSessionCookies(response, tokens);
      return response;
    }
    const result = await authenticatedBackendRequest(
      "/v1/me",
      {},
      accessToken,
      refreshToken,
    );
    if (result.response.status === 401) {
      const response = NextResponse.json(
        { message: "Sua sessão expirou. Entre novamente." },
        { status: 401 },
      );
      clearSessionCookies(response);
      return response;
    }
    if (!result.response.ok) throw new Error("Backend unavailable");
    const payload: unknown = await result.response.json();
    const user = userResponseSchema.parse(payload);
    const token = result.tokens?.accessToken ?? accessToken;
    if (action === "organization") {
      const body: unknown = await request.json();
      const selection = organizationSelectionSchema.safeParse(body);
      if (!selection.success)
        return NextResponse.json(
          { message: "Selecione uma ONG válida." },
          { status: 400 },
        );
      const upstream = await fetchBackend(
        `/v1/organizations/${selection.data.organizationId}`,
        {},
        token,
      );
      if (!upstream.ok)
        return NextResponse.json(
          { message: "Você não tem acesso a esta ONG." },
          { status: upstream.status },
        );
      const data: unknown = await upstream.json();
      const organization = organizationResponseSchema.parse(data);
      if (organization.legalName === undefined)
        return NextResponse.json(
          { message: "Você não tem acesso a esta ONG." },
          { status: 403 },
        );
      const response = NextResponse.json({ ok: true });
      setOrganizationCookie(response, user.id, selection.data.organizationId);
      if (result.tokens) setSessionCookies(response, result.tokens);
      return response;
    }
    let organization: OrganizationResponse | null = null;
    const organizationId = selectedOrganization(request.cookies, user.id);
    if (organizationId) {
      const upstream = await fetchBackend(
        `/v1/organizations/${encodeURIComponent(organizationId)}`,
        {},
        token,
      );
      if (upstream.ok) {
        const body: unknown = await upstream.json();
        const parsed = organizationResponseSchema.parse(body);
        if (parsed.legalName !== undefined) organization = parsed;
      }
    }
    const response = NextResponse.json(
      {
        id: user.id,
        role: organization ? "ngo" : "adopter",
        user: toWire(user),
        organization: toWire(organization),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
    if (result.tokens) setSessionCookies(response, result.tokens);
    return response;
  } catch (error: unknown) {
    const malformed = error instanceof SyntaxError;
    return NextResponse.json(
      {
        message: malformed
          ? "Dados inválidos."
          : "Não foi possível conectar ao serviço. Tente novamente.",
      },
      { status: malformed ? 400 : 503 },
    );
  }
}
export { handle as GET, handle as POST };
