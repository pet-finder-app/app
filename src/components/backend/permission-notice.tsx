type PermissionNoticeProps = { action: string };
/** Shown instead of controls the member's Go permissions would refuse. */
export function PermissionNotice({ action }: PermissionNoticeProps) {
  return (
    <p role="note">
      Sua função nesta ONG não permite {action}. Peça a um coordenador da
      equipe.
    </p>
  );
}
