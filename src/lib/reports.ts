import { randomUUID } from "node:crypto";
import { appendFile } from "node:fs/promises";
import path from "node:path";
import type { ContentReportInput } from "./report";

const REPORTS_FILE = path.join(process.cwd(), "src", "data", "reports.jsonl");

/** Append reports without a read/overwrite race in the local prototype store. */
export async function createContentReport(
  reporterId: string,
  input: ContentReportInput,
): Promise<void> {
  const report = {
    id: randomUUID(),
    reporterId,
    targetType: input.targetType,
    targetId: input.targetId,
    reason: input.reason.trim(),
    createdAt: new Date().toISOString(),
  };
  await appendFile(REPORTS_FILE, `${JSON.stringify(report)}\n`, "utf-8");
}
