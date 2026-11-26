"use client";

import styles from "@/components/auth/photo-auth-layout.module.css";
import { iconSize } from "@/components/ui/icon";
import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";

type AuthPasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

/** Password input for the photographic auth screens, with a visibility toggle. */
export function AuthPasswordInput(props: AuthPasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <div className={styles.password}>
      <input {...props} type={isVisible ? "text" : "password"} />
      <button
        type="button"
        onClick={() => setIsVisible((visible) => !visible)}
        aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={isVisible}
        className={styles.passwordToggle}
      >
        {isVisible ? (
          <EyeOff className={iconSize.lg} aria-hidden="true" />
        ) : (
          <Eye className={iconSize.lg} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
