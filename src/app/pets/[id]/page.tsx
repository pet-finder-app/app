import { AnimalDetailScreen } from "@/components/api/animals";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AnimalDetailScreen id={id} />;
}
