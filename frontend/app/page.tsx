"use client";

import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { ChatThread } from "@/components/ChatThread";
import { InputBar } from "@/components/InputBar";
import { useChat } from "@/hooks/useChat";
import { AgentMode, Conversation } from "@/lib/types";

export default function Home() {
  const {
    conversation,
    mode,
    setMode,
    isSending,
    sendMessage,
    stopSending,
    startNewConversation,
    loadConversation,
  } = useChat();

  const handleExample = (text: string, exampleMode: AgentMode) => {
    setMode(exampleMode);
    sendMessage(text, exampleMode);
  };

  const handleSelectConversation = (c: Conversation) => {
    loadConversation(c);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas">
      <Sidebar
        activeConversationId={conversation.id}
        onNewChat={startNewConversation}
        onSelectConversation={handleSelectConversation}
        onExamplePrompt={handleExample}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <ChatThread messages={conversation.messages} onExampleClick={handleExample} />
        <InputBar
          mode={mode}
          onModeChange={setMode}
          onSend={sendMessage}
          onStop={stopSending}
          isSending={isSending}
        />
      </div>
    </div>
  );
}
