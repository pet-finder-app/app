/**
 * Vocabulário compartilhado do estilo "soft UI": sombra suave e difusa (sem
 * borda grossa) para dar profundidade, e um leve encolhimento no clique em
 * vez de deslocamento — o elemento "afunda" só um pouco, sem mudar de lugar.
 */

export type ElevationSize = "sm" | "md" | "lg" | "xl";

export const shadowSoft: Record<ElevationSize, string> = {
  sm: "shadow-[0_2px_8px_-2px_rgba(15,23,42,0.10)]",
  md: "shadow-[0_6px_16px_-4px_rgba(15,23,42,0.10)]",
  lg: "shadow-[0_10px_28px_-8px_rgba(15,23,42,0.12)]",
  xl: "shadow-[0_18px_36px_-10px_rgba(15,23,42,0.14)]",
};

/** Aplique em elementos clicáveis (button, a, label de arquivo). */
export const pressSoft: Record<ElevationSize, string> = {
  sm: "transition-transform active:scale-[0.97]",
  md: "transition-transform active:scale-[0.97]",
  lg: "transition-transform active:scale-[0.98]",
  xl: "transition-transform active:scale-[0.98]",
};
