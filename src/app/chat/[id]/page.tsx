import { ChatLoader } from "./chat-loader";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChatLoader chatId={id} />;
}
