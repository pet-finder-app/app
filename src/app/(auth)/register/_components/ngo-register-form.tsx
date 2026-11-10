"use client";
import { RegisterForm } from "./register-form";

export function NgoRegisterForm({ onBack }: { onBack: () => void }) {
  return <RegisterForm onBack={onBack} afterSignup="/ngo/register" />;
}
