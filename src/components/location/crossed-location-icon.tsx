"use client";

import { cn } from "@/components/ui";
import { MapPin } from "lucide-react";
import { useId } from "react";
import styles from "./location-disabled-dialog.module.css";

type CrossedLocationIconProps = {
  className?: string;
  animated?: boolean;
};

/** A transparent gap beside the diagonal stroke reveals the actual surface. */
export function CrossedLocationIcon({
  className,
  animated = false,
}: CrossedLocationIconProps) {
  const maskId = useId();
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn(className, animated && styles.wiggle)}
    >
      <defs>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="24"
          height="24"
        >
          <rect width="24" height="24" fill="white" />
          <path
            d="M3 3 21 21"
            pathLength={1}
            stroke="black"
            strokeWidth={6}
            strokeLinecap="round"
            className={animated ? styles.drawSlash : undefined}
          />
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        <MapPin width={24} height={24} strokeWidth={2} />
      </g>
      <path
        d="M3 3 21 21"
        pathLength={1}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        className={animated ? styles.drawSlash : undefined}
      />
    </svg>
  );
}
