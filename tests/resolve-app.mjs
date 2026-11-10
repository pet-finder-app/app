import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
export const appRoot = fileURLToPath(new URL("../", import.meta.url));
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "next/server")
      return nextResolve("next/server.js", context);
    const target = specifier.startsWith("@/")
      ? pathToFileURL(path.join(appRoot, "src", specifier.slice(2)))
      : specifier.startsWith(".") && context.parentURL?.includes("/src/")
        ? new URL(specifier, context.parentURL)
        : null;
    if (
      target &&
      !path.extname(target.pathname) &&
      existsSync(`${fileURLToPath(target)}.ts`)
    )
      return nextResolve(`${target.href}.ts`, context);
    return nextResolve(specifier, context);
  },
});
