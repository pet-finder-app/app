import { ApplicationListScreen } from "@/components/api/applications";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ApplicationListScreen organization animalId={id} />;
}
