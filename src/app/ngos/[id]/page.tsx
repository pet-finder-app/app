import { OrganizationDetailScreen } from "@/components/api/organizations";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrganizationDetailScreen id={id} />;
}
