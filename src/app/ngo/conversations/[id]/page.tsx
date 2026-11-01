import { ChatScreen } from "@/components/api/chat";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChatScreen id={id} organization />;
}
