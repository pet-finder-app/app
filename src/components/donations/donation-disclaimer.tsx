type DonationDisclaimerProps = { className?: string };
/** Petfinder never moves money; it only records a transfer the donor reports. */
export function DonationDisclaimer({ className }: DonationDisclaimerProps) {
  return (
    <p role="note" className={className ?? "text-sm text-neutral-600"}>
      O Petfinder não processa pagamentos. Você transfere o valor diretamente
      para a ONG, usando os dados publicados por ela, e depois informa a
      transferência aqui. A doação fica registrada como &quot;Aguardando
      confirmação&quot; até a ONG conferir o extrato e confirmar o recebimento.
    </p>
  );
}
