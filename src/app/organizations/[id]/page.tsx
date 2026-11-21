import { BackendShell } from "@/components/backend/backend-shell";
import { FollowButton } from "@/components/community/follow-button";
import { loadOrganization } from "@/components/community/load-post";
import { profileIdentity } from "@/components/community/organization-identity";
import { PostList } from "@/components/community/post-list";
import { NgoPostHeader } from "@/components/ngo/ngo-post-header";
import { getCurrentUser } from "@/lib/backend/server";
import type { Metadata } from "next";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const organization = await loadOrganization(id);
  return { title: organization.name };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  await getCurrentUser();
  const organization = await loadOrganization(id);
  const isVerified = organization.verificationStatus === "verified";
  const place = [organization.location?.city, organization.location?.state]
    .filter(Boolean)
    .join(" · ");
  return (
    <BackendShell>
      <div className="-mx-4">
        <NgoPostHeader {...profileIdentity(organization)} />
      </div>
      <h1 className="text-2xl font-bold">{organization.name}</h1>
      {place ? <p className="text-sm text-neutral-600">{place}</p> : null}
      {organization.description ? (
        <p className="leading-relaxed whitespace-pre-line">
          {organization.description}
        </p>
      ) : null}
      {organization.officialChannels.website ? (
        <p className="text-sm break-all">
          Site: {organization.officialChannels.website}
        </p>
      ) : null}
      {isVerified ? (
        <>
          <FollowButton organizationId={organization.id} />
          <h2 className="text-lg font-bold">Publicações</h2>
          <PostList
            source={{ kind: "organization", organizationId: organization.id }}
            emptyMessage="Esta ONG ainda não publicou nada."
            hasOrganizationLink={false}
          />
        </>
      ) : (
        <p role="note">
          Esta ONG ainda não foi verificada; seguidores e publicações ficam
          disponíveis após a verificação.
        </p>
      )}
    </BackendShell>
  );
}
