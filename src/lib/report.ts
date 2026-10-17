/** Client-safe content-report input. Reports are stored for later review. */
export type ContentReportInput = {
  targetType: "pet" | "post";
  targetId: string;
  reason: string;
};

export function isContentReportInput(
  value: unknown,
): value is ContentReportInput {
  return (
    typeof value === "object" &&
    value !== null &&
    "targetType" in value &&
    (value.targetType === "pet" || value.targetType === "post") &&
    "targetId" in value &&
    typeof value.targetId === "string" &&
    value.targetId.length > 0 &&
    value.targetId.length <= 200 &&
    "reason" in value &&
    typeof value.reason === "string" &&
    value.reason.trim().length >= 10 &&
    value.reason.length <= 2000
  );
}
