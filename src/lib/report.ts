/** Feed report input mapped to the Go report contract at the API boundary. */
export type ContentReportInput = {
  targetType: "pet" | "post";
  targetId: string;
  reason: string;
};
