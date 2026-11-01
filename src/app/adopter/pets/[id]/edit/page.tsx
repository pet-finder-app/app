import { AnimalEditorScreen } from "@/components/api/animals";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AnimalEditorScreen id={id} privateSubmission />;
}
