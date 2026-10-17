/** Shared soft-UI elevation: diffuse shadows and subtle press scaling without changing layout position. */

export type ElevationSize = "sm" | "md" | "lg" | "xl";

export const shadowSoft: Record<ElevationSize, string> = {
  sm: "shadow-[0_2px_8px_-2px_rgba(15,23,42,0.10)]",
  md: "shadow-[0_6px_16px_-4px_rgba(15,23,42,0.10)]",
  lg: "shadow-[0_10px_28px_-8px_rgba(15,23,42,0.12)]",
  xl: "shadow-[0_18px_36px_-10px_rgba(15,23,42,0.14)]",
};

/** Apply to interactive elements such as buttons, links, and file-input labels. */
export const pressSoft: Record<ElevationSize, string> = {
  sm: "transition-transform active:scale-[0.97]",
  md: "transition-transform active:scale-[0.97]",
  lg: "transition-transform active:scale-[0.98]",
  xl: "transition-transform active:scale-[0.98]",
};
