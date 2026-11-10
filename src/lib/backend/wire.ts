/** Keep Go protocol keys at the transport boundary; application models use camelCase. */
export function toWire(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item: unknown) => toWire(item));
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]: [string, unknown]) => [
        key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
        toWire(item),
      ]),
    );
  }
  return value;
}
