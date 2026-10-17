import { PawIcon } from "@/components/brand/paw-icon";
import { BrutalCard } from "@/components/ui/brutal-card";
import { VerificationBadge } from "@/components/verification/verification-badge";
import { maskPhone } from "@/lib/br-documents";
import { formatAddress, type NgoProfile } from "@/lib/ngo";
import type { Pet } from "@/lib/pet";
import { MapPin, Phone } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5">
      <span className="text-sm font-bold text-neutral-900">{value}</span>
      <span className="w-full truncate text-center text-[11px] leading-tight text-neutral-600">
        {label}
      </span>
    </div>
  );
}

type NgoProfileCardProps = {
  ngo: NgoProfile;
  pets: Pet[];
  /** Actions displayed in the card footer. */
  children?: ReactNode;
};

/** Feed-style NGO profile card with avatar, statistics, biography, and contact information. */
export function NgoProfileCard({ ngo, pets, children }: NgoProfileCardProps) {
  const status = ngo.verification.status;
  const availableCount = pets.filter((p) => p.status === "available").length;
  const address = formatAddress(ngo.legal.address);
  const phone = ngo.representative.phone;

  return (
    <BrutalCard as="header" className="gap-3">
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-900 bg-primary-soft"
        >
          {ngo.publicProfile.logo?.url ? (
            <Image
              src={ngo.publicProfile.logo.url}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <PawIcon className="size-8 text-lime-800" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="truncate text-base font-bold text-neutral-900">
              {ngo.legal.tradeName}
            </h1>
            <VerificationBadge status={status} compact />
          </div>
          <p className="truncate text-xs text-neutral-600">
            @{ngo.legal.nickname}
          </p>
          <div className="mt-2 grid grid-cols-3 gap-1">
            <Stat value={pets.length} label="Pets" />
            <Stat value={availableCount} label="Disponíveis" />
            <Stat value={ngo.publicProfile.followersCount} label="Seguidores" />
          </div>
        </div>
      </div>

      <p className="text-sm text-neutral-900">
        {ngo.publicProfile.description || "Adicione uma descrição da sua ONG."}
      </p>

      {address || phone ? (
        <div className="flex flex-col gap-1.5">
          {address ? (
            <p className="flex items-start gap-1.5 text-sm text-neutral-600">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{address}</span>
            </p>
          ) : null}
          {phone ? (
            <p className="flex items-center gap-1.5 text-sm text-neutral-600">
              <Phone className="size-4 shrink-0" aria-hidden="true" />
              <span>{maskPhone(phone)}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {children}
    </BrutalCard>
  );
}
