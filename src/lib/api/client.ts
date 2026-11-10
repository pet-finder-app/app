export class ApiError extends Error {
  readonly status: number;
  readonly field: string | undefined;
  readonly isInternal: boolean;
  readonly isAuthenticationFailure: boolean;

  constructor(
    status: number,
    message: string,
    field?: string,
    isInternal = true,
    isAuthenticationFailure = status === 401,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.field = field;
    this.isInternal = isInternal;
    this.isAuthenticationFailure = isAuthenticationFailure;
  }
}

/** Keep untrusted JSON unknown until the caller validates its response contract. */
export async function requestJson(
  path: string,
  init?: RequestInit,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(path, { ...init, cache: "no-store" });
  } catch (error: unknown) {
    if (init?.signal?.aborted) throw error;
    throw new Error("Falha de conexão. Tente novamente.");
  }
  if (response.status === 204) return null;
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(
      response.status,
      "Não foi possível ler a resposta. Tente novamente.",
      undefined,
      path.startsWith("/api/"),
    );
  }
  if (!response.ok) {
    let field: string | undefined;
    let message = "Não foi possível concluir a solicitação.";
    if (typeof payload === "object" && payload !== null) {
      if ("message" in payload && typeof payload.message === "string")
        message = payload.message;
      else if ("title" in payload && payload.title === "Invalid OTP")
        message = "Código inválido ou expirado. Confira o código informado.";
      else if (response.status === 401)
        message =
          "E-mail ou senha incorretos, ou sua sessão expirou. Entre novamente.";
      else if (response.status === 403)
        message = "Você não tem permissão para realizar esta ação.";
      else if (response.status === 404)
        message = "O registro solicitado não foi encontrado.";
      else if (response.status === 409)
        message =
          "A solicitação conflita com os dados atuais. Confira se o cadastro já existe.";
      else if ([400, 422].includes(response.status))
        message = "Revise os campos informados e tente novamente.";
      else if (response.status >= 500)
        message = "O serviço está indisponível. Tente novamente.";
      if ("field" in payload && typeof payload.field === "string")
        field = payload.field;
      else if (
        "errors" in payload &&
        typeof payload.errors === "object" &&
        payload.errors !== null
      ) {
        field = Object.keys(payload.errors)[0]
          ?.replace(/^body\./, "")
          .replace(/_([a-z])/g, (_match: string, letter: string) =>
            letter.toUpperCase(),
          );
      }
    }
    throw new ApiError(
      response.status,
      message,
      field,
      path.startsWith("/api/"),
      response.status === 401 &&
        !(
          typeof payload === "object" &&
          payload !== null &&
          "title" in payload &&
          payload.title === "Invalid OTP"
        ),
    );
  }
  return payload;
}

export function jsonBody(value: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  };
}

/** Decode successful responses at the API boundary, before data reaches the cache. */
export async function requestData<T>(
  path: string,
  schema: {
    safeParse: (
      value: unknown,
    ) => { success: true; data: T } | { success: false };
  },
  init?: RequestInit,
): Promise<T> {
  const result = schema.safeParse(await requestJson(path, init));
  if (!result.success)
    throw new Error("Resposta inválida do servidor. Tente novamente.");
  return result.data;
}
