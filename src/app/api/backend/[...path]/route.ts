import {
  ACCESS_COOKIE,
  apiOrigin,
  sameOrigin,
  unavailable,
} from "@/lib/api/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Restrict this authenticated proxy to the resources in the OpenAPI contract.
const allowed =
  /^v1\/(?:me|animals(?:\/[\w-]+(?:\/(?:status|preference|images(?:\/[\w-]+)?))?)?|applications(?:\/[\w-]+(?:\/(?:screening|decision|appointments))?)?|appointments\/[\w-]+(?:\/(?:confirmations|otp))?|conversations(?:\/[\w-]+\/messages)?|organizations(?:\/[\w-]+(?:\/(?:verification|members(?:\/[\w-]+)?))?)?|preferences|reports(?:\/[\w-]+)?)$/;

async function proxy(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (request.method !== "GET" && !sameOrigin(request))
    return new NextResponse(null, { status: 403 });
  const path = (await params).path.join("/");
  if (!allowed.test(path)) return new NextResponse(null, { status: 404 });
  try {
    const access = (await cookies()).get(ACCESS_COOKIE)?.value;
    const upstream = await fetch(
      `${apiOrigin()}/${path}${new URL(request.url).search}`,
      {
        method: request.method,
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
        headers: {
          Accept: "application/json",
          ...(access ? { Authorization: `Bearer ${access}` } : {}),
          ...(request.method !== "GET"
            ? { "Content-Type": "application/json" }
            : {}),
        },
        body: request.method === "GET" ? undefined : await request.text(),
      },
    );
    return new NextResponse(
      upstream.status === 204 ? null : await upstream.text(),
      {
        status: upstream.status,
        headers: {
          "Content-Type":
            upstream.headers.get("Content-Type") ?? "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return unavailable(error);
  }
}

export {
  proxy as DELETE,
  proxy as GET,
  proxy as PATCH,
  proxy as POST,
  proxy as PUT,
};
