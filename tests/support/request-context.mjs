// A request cookie jar used only by server-route tests, outside the Next runtime.
let values = new Map();

export function setRequestCookies(cookies = {}) {
  values = new Map(Object.entries(cookies));
}

export async function cookies() {
  return {
    get: (name) =>
      values.has(name) ? { name, value: values.get(name) } : undefined,
  };
}
