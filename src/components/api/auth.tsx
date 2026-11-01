"use client";

import { PhotoAuthLayout } from "@/components/auth/photo-auth-layout";
import { Button, Checkbox, Input, LinkButton, TextLink } from "@/components/ui";
import { session } from "@/lib/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorMessage, field } from "./common";

export function AuthScreen({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const client = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const mutation = useMutation({
    mutationFn: (form: FormData) => {
      if (
        register &&
        (form.get("accepted_terms") !== "on" ||
          form.get("accepted_privacy_policy") !== "on")
      )
        throw new Error(
          "Aceite os termos e a política de privacidade para continuar.",
        );
      return register
        ? session("register", {
            name: field(form, "name"),
            email: field(form, "email"),
            password: String(form.get("password")),
            accepted_terms: true,
            accepted_privacy_policy: true,
          })
        : session("login", {
            email: field(form, "email"),
            password: String(form.get("password")),
          });
    },
    onSuccess: (user) => {
      client.clear();
      client.setQueryData(["me"], user);
      router.replace("/");
    },
  });
  return (
    <PhotoAuthLayout
      heading={register ? "Criar conta" : "Entrar"}
      registration={register}
      footer={
        <LinkButton
          href={register ? "/login" : "/register"}
          variant="secondary"
        >
          {register ? "Já tenho conta" : "Criar conta"}
        </LinkButton>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(new FormData(e.currentTarget));
        }}
      >
        {register && (
          <Input
            tone="photo"
            id="name"
            label="Nome"
            autoComplete="name"
            minLength={2}
            maxLength={120}
            required
          />
        )}
        <Input
          tone="photo"
          id="email"
          label="E-mail"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
        />
        <Input
          tone="photo"
          id="password"
          label="Senha"
          type={showPassword ? "text" : "password"}
          autoComplete={register ? "new-password" : "current-password"}
          minLength={register ? 12 : 1}
          maxLength={72}
          pattern={register ? "(?=.*[A-Za-z])(?=.*[0-9]).{12,72}" : undefined}
          hint={
            register
              ? "De 12 a 72 caracteres, com letra e número (máximo de 72 bytes)."
              : undefined
          }
          required
        />
        <Checkbox
          tone="photo"
          id="show-password"
          label="Mostrar senha"
          checked={showPassword}
          onChange={(e) => setShowPassword(e.target.checked)}
        />
        {register && (
          <>
            <Checkbox
              tone="photo"
              id="accepted_terms"
              label={
                <span>
                  Li e aceito os{" "}
                  <TextLink tone="photo" href="/terms">
                    termos de uso
                  </TextLink>
                  .
                </span>
              }
              required
            />
            <Checkbox
              tone="photo"
              id="accepted_privacy_policy"
              label="Li e aceito a política de privacidade apresentada nos termos."
              required
            />
            <p className="text-xs">
              Representa uma ONG? Crie sua conta e cadastre a organização na
              área da ONG.
            </p>
          </>
        )}
        <ErrorMessage error={mutation.error} />
        <Button
          type="submit"
          variant="photo"
          loading={mutation.isPending}
          loadingLabel="Aguarde…"
        >
          {register ? "CRIAR CONTA" : "ENTRAR"}
        </Button>
        {register && (
          <TextLink tone="photo" href="/login">
            Já tenho conta
          </TextLink>
        )}
      </form>
    </PhotoAuthLayout>
  );
}
