"use client";

import styles from "@/components/navigation/navigation-feedback.module.css";
import { NavigationTabIcon } from "@/components/navigation/navigation-tab-icon";
import { cn } from "@/components/ui";
import { UserRound } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type ProfileTabIconProps = {
  avatarUrl: string | null;
  active: boolean;
};

/** Shared profile-tab photo with an inset-free active outline and icon fallback. */
export function ProfileTabIcon({ avatarUrl, active }: ProfileTabIconProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (!avatarUrl || avatarUrl === failedUrl) {
    return <NavigationTabIcon icon={UserRound} active={active} />;
  }

  return (
    <span className={styles.icon} data-active={active}>
      <Image
        src={avatarUrl}
        alt=""
        width={22}
        height={22}
        className={cn(
          "size-5.5 shrink-0 rounded-full object-cover",
          active && "outline-2 outline-offset-1 outline-current",
        )}
        onError={() => setFailedUrl(avatarUrl)}
      />
    </span>
  );
}
