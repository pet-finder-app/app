/** Import Lucide icons directly and use iconSize for consistent sizing. Hide decorative icons from assistive technology; icon-only controls need accessible names. Status must also have visible or screen-reader text. */
export const iconSize = {
  /** Icons in badges, chips, and small buttons. */
  sm: "size-3.5",
  /** Default icons in buttons and beside body text. */
  md: "size-4",
  /** Larger standalone or empty-state icons. */
  lg: "size-5",
} as const;
