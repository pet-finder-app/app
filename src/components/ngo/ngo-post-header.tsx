import { PawIcon } from "@/components/brand/paw-icon";
import { cn } from "@/components/ui";
import { Building2 } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

type NgoPostHeaderProps = {
  name: string;
  nickname: string;
  logoUrl: string | null;
  action?: ReactNode;
  compact?: boolean;
};

/** Organization identity shared by NGO posts and the adopter feed. */
export function NgoPostHeader({
  name,
  nickname,
  logoUrl,
  action,
  compact = false,
}: NgoPostHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center gap-3 px-4 text-text",
        compact ? "py-1" : "py-3",
      )}
    >
      <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt=""
            fill
            sizes="40px"
            className="object-cover"
          />
        ) : (
          <PawIcon className="size-5" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-bold">
          <span className="truncate">{nickname ? `@${nickname}` : name}</span>
          <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="sr-only">ONG</span>
        </p>
        <p className="truncate text-xs text-neutral-600">{name}</p>
      </div>
      {action}
    </header>
  );
}
