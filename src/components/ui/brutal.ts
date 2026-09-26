/**
 * Vocabulário compartilhado do estilo neo-brutalista: sombra dura (sem
 * blur, deslocada) e o efeito de "pressionar" — no clique, o elemento anda
 * na direção da sombra e ela some, como se afundasse na página.
 *
 * Use a mesma chave de tamanho da sombra e do "press" (ex.: `sm` com `sm`)
 * para o deslocamento bater exatamente com a sombra que desaparece.
 */

export type BrutalSize = "sm" | "md" | "lg" | "xl";

export const shadowBrutal: Record<BrutalSize, string> = {
  sm: "shadow-[1px_1px_0_0_var(--color-line)]",
  md: "shadow-[1.5px_1.5px_0_0_var(--color-line)]",
  lg: "shadow-[2px_2px_0_0_var(--color-line)]",
  xl: "shadow-[3px_3px_0_0_var(--color-line)]",
};

/** Aplique em elementos clicáveis (button, a, label de arquivo). */
export const pressBrutal: Record<BrutalSize, string> = {
  sm: "transition-transform active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
  md: "transition-transform active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none",
  lg: "transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
  xl: "transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
};
