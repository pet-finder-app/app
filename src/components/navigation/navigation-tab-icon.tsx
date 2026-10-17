"use client";

import { iconSize } from "@/components/ui";
import type { LucideIcon } from "lucide-react";
import { useId } from "react";
import styles from "./navigation-feedback.module.css";

type NavigationTabIconProps = {
  icon: LucideIcon;
  active: boolean;
};

/** Widen the icon's actual contours inward, constrained to its filled shape. */
export function NavigationTabIcon({
  icon: Icon,
  active,
}: NavigationTabIconProps) {
  const maskId = useId();

  return (
    <span className={styles.icon} data-active={active} aria-hidden="true">
      <svg className={iconSize.lg} viewBox="0 0 24 24">
        <defs>
          <mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="24"
            height="24"
          >
            <Icon
              width={24}
              height={24}
              fill="none"
              stroke="white"
              className={styles.fillContour}
            />
          </mask>
        </defs>
        <Icon
          width={24}
          height={24}
          fill="currentColor"
          strokeWidth={0}
          mask={`url(#${maskId})`}
        />
      </svg>
      <Icon className={styles.outline} fill="none" />
    </span>
  );
}
