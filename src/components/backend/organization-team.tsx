"use client";
import { Button, FormError, Input, Select } from "@/components/ui";
import { apiMutations } from "@/lib/api/mutations";
import { membersOptions } from "@/lib/api/queries";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { QueryStatus } from "./query-status";

const ROLE_LABELS: Record<string, string> = {
  owner: "Responsável",
  coordinator: "Coordenação",
  representative: "Representação",
  moderator: "Moderação",
};
const roleSchema = z.enum(["coordinator", "representative", "moderator"]);
export function OrganizationTeam({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const query = useQuery(membersOptions(organizationId));
  const invite = useMutation(apiMutations.inviteMember());
  const remove = useMutation(apiMutations.removeMember());
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(roleSchema.parse("representative"));
  const canManageMembers = query.data?.items.some(
    (member) =>
      member.userId === userId &&
      member.status === "active" &&
      member.canManageMembers,
  );
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invite.isPending)
      invite.mutate(
        { organizationId, email, role },
        { onSuccess: () => setEmail("") },
      );
  }
  return (
    <>
      <QueryStatus query={query} />
      <ul className="flex flex-col gap-3">
        {query.data?.items.map((member) => (
          <li key={member.id}>
            <p className="font-bold">{member.displayName}</p>
            <p>{member.email}</p>
            <p>{ROLE_LABELS[member.memberRole] ?? "Membro"}</p>
            {canManageMembers && member.userId && member.userId !== userId ? (
              <Button
                variant="outline"
                loading={remove.isPending}
                onClick={() => {
                  if (member.userId)
                    remove.mutate({ organizationId, userId: member.userId });
                }}
              >
                Remover membro
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      {canManageMembers ? (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Input
            id="member-email"
            label="E-mail da pessoa"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Select
            id="member-role"
            label="Permissão"
            value={role}
            options={[
              { value: "coordinator", label: "Coordenação" },
              { value: "representative", label: "Representação" },
              { value: "moderator", label: "Moderação" },
            ]}
            onChange={(event) => setRole(roleSchema.parse(event.target.value))}
          />
          <Button type="submit" loading={invite.isPending}>
            Convidar membro
          </Button>
        </form>
      ) : null}
      <FormError id="team-error">
        {invite.error?.message ?? remove.error?.message}
      </FormError>
    </>
  );
}
