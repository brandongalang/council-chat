import ChatInterface from "@/components/chat-interface";

export default function ChatSessionPage(props: { params: Promise<{ id: string }> }) {
  // In a real app, we'd pass the initialMessages to ChatInterface
  // For cc-14, we just render the interface.
  return <ChatInterface />;
}
