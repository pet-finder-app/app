"use client";

import { RoleSelect } from "@/components/role-select";
import type { AccountRole } from "@/lib/users";
import { useState } from "react";
import { RegisterForm } from "./register-form";

/**
 * Primeiro passo do cadastro: escolher entre adotante e ONG. Hoje os dois
 * levam ao mesmo formulário (só o rótulo do nome muda) — quando o
 * formulário específico da ONG existir, é só trocar o que aparece aqui
 * quando `role === "ong"`.
 */
export function RegisterFlow() {
  const [role, setRole] = useState<AccountRole | null>(null);

  if (!role) {
    return <RoleSelect onSelect={setRole} />;
  }

  return <RegisterForm role={role} onBack={() => setRole(null)} />;
}
