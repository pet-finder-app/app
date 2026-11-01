"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { iconSize } from "./icon";
import { Input, type InputProps } from "./input";

export type PasswordInputProps = Omit<InputProps, "type" | "trailing">;

/** Password field with an independent, accessible visibility toggle. */
export function PasswordInput({ id, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      {...props}
      id={id}
      type={showPassword ? "text" : "password"}
      trailing={
        <button
          type="button"
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          aria-controls={id}
          aria-pressed={showPassword}
          disabled={props.disabled}
          onClick={() => setShowPassword((previous) => !previous)}
          className="flex size-11 items-center justify-center rounded-lg text-text/65 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
        >
          {showPassword ? (
            <EyeOff className={iconSize.lg} aria-hidden="true" />
          ) : (
            <Eye className={iconSize.lg} aria-hidden="true" />
          )}
        </button>
      }
    />
  );
}
