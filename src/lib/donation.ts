/**
 * Doações que a ONG recebeu de adotantes/apoiadores pela chave Pix do
 * perfil público. Hoje simuladas em `donations.json`, até existir um
 * backend real que confirme os pagamentos.
 *
 * Este arquivo não importa nada do Node: pode ser usado no client.
 */

export type ReceivedDonation = {
  id: string;
  ongId: string;
  donorName: string;
  /** Em reais. */
  amount: number;
  /** ISO datetime. */
  createdAt: string;
};
