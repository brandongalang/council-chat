import ChatInterface from "@/components/chat-interface";
import { Suspense } from "react";

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatInterface />
    </Suspense>
  );
}
