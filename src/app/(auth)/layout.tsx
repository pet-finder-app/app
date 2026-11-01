import { PetSlideshow } from "@/components/auth/pet-slideshow";
import styles from "@/components/auth/photo-auth-layout.module.css";
import type { ReactNode } from "react";

/** Keep the photographic background mounted across authentication navigation. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.authShell}>
      <PetSlideshow />
      {children}
    </div>
  );
}
