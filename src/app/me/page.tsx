import { DeleteAccountButton } from "@/components/account/delete-account-button";
import { LogoutButton } from "@/components/account/logout-button";
import { BackendShell } from "@/components/backend/backend-shell";
import { ProfileForm } from "@/components/backend/profile-form";
import { MenuLink, MenuList } from "@/components/ui";
import {
  getCurrentOrganization,
  getCurrentUser,
  isPlatformAdmin,
} from "@/lib/backend/server";
import {
  ArrowLeftRight,
  Building2,
  CirclePlus,
  ClipboardList,
  HandCoins,
  HeartHandshake,
  LayoutDashboard,
  Newspaper,
  PawPrint,
  Send,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const organization = await getCurrentOrganization();
  return (
    <BackendShell title="Meu perfil" organization={Boolean(organization)}>
      <ProfileForm user={user} />
      <MenuList title="Atividades">
        {organization ? (
          <MenuLink href="/ngo/dashboard" icon={LayoutDashboard}>
            Administrar {organization.name}
          </MenuLink>
        ) : null}
        <MenuLink href="/ngo/organizations" icon={Building2}>
          Minhas organizações
        </MenuLink>
        <MenuLink href="/ngo/register" icon={CirclePlus}>
          Cadastrar uma ONG
        </MenuLink>
        <MenuLink href="/adopter/animals/new" icon={Send}>
          Encaminhar animal para uma ONG
        </MenuLink>
        <MenuLink href="/adopter/animals" icon={PawPrint}>
          Animais que encaminhei
        </MenuLink>
        <MenuLink href="/adopter/adoptions" icon={ClipboardList}>
          Meus pedidos de adoção
        </MenuLink>
        <MenuLink href="/feed" icon={Newspaper}>
          Publicações das ONGs que sigo
        </MenuLink>
        <MenuLink href="/adopter/following" icon={HeartHandshake}>
          ONGs que sigo
        </MenuLink>
        <MenuLink href="/adopter/donate" icon={HandCoins}>
          Doações
        </MenuLink>
        <MenuLink href="/adopter/surrenders" icon={ArrowLeftRight}>
          Entregar ou devolver um animal
        </MenuLink>
      </MenuList>
      <MenuList title="Conta">
        {isPlatformAdmin(user) ? (
          <MenuLink href="/admin/verifications" icon={ShieldCheck}>
            Analisar verificações
          </MenuLink>
        ) : null}
        <LogoutButton confirm menu />
        <DeleteAccountButton />
      </MenuList>
      <Link
        href="/terms"
        className="mt-auto pt-6 text-center text-sm font-medium text-accent-tertiary hover:underline focus-visible:outline-2 focus-visible:outline-accent-tertiary"
      >
        Termos de uso e política de privacidade
      </Link>
    </BackendShell>
  );
}
