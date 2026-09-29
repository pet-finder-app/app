"use client";

import { RoleSelect } from "@/components/role-select";
import type { AccountRole } from "@/lib/users";
import { useState } from "react";
import { OngRegisterForm } from "./ong-register-form";
import { RegisterForm } from "./register-form";

/**
 * Primeiro passo do cadastro: escolher entre adotante e ONG. Cada papel
 * tem seu formulário — o da ONG pede tipo de organização e CPF/CNPJ.
 */
export function RegisterFlow() {
  const [role, setRole] = useState<AccountRole | null>(null);

  if (!role) {
    return <RoleSelect onSelect={setRole} />;
  }

  if (role === "ong") {
    return <OngRegisterForm onBack={() => setRole(null)} />;
  }

  return <RegisterForm onBack={() => setRole(null)} />;
}
