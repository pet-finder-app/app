/**
 * Padrão de ícones do UI System: todos vêm de `lucide-react`, importados
 * diretamente onde são usados — não há wrapper de componente, só a regra
 * de tamanho e acessibilidade abaixo.
 *
 * Tamanho: use as classes daqui (`iconSize`) em vez de escolher um número
 * solto, para todo ícone do app ficar na mesma escala.
 *
 * Acessibilidade:
 * - Ícone puramente decorativo (ao lado de um texto que já diz a mesma
 *   coisa): `aria-hidden="true"`.
 * - Ícone que É a única informação (ex.: um botão só com ícone): o
 *   elemento pai precisa de `aria-label` — nunca deixe sem nome acessível.
 * - Estado (concluído, erro, verificado...) nunca é só o ícone: sempre
 *   acompanhado de texto visível ou `sr-only`.
 */
export const iconSize = {
  /** Dentro de selos, chips e botões pequenos. */
  sm: "size-3.5",
  /** Padrão: dentro de botões e ao lado de texto de corpo. */
  md: "size-4",
  /** Destaque maior: cabeçalhos de estado vazio, ícones isolados. */
  lg: "size-5",
} as const;
