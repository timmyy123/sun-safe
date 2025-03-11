"use client";

import React, { useState } from "react";
import { Bot, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chat } from "@/components/ui/chat";
import { useChat } from "ai/react";
import { nanoid } from "nanoid";
import { Message } from "@/components/ui/chat-message";
import { cn } from "@/lib/utils";

export default function AIAssistantButton() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    append,
    isLoading,
    stop,
  } = useChat({
    api: "/api/chat", // <-- Specify the API endpoint
  });

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating button in bottom-right corner */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={toggleChat}
          className={cn(
            "h-14 w-14 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg hover:from-yellow-500 hover:to-orange-600",
            isOpen && "bg-red-500 hover:bg-red-600"
          )}
        >
          {isOpen ? <X size={24} /> : <Bot size={24} />}
        </Button>
      </div>

      {/* Chat container */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-80 md:w-96 h-[500px] rounded-lg shadow-xl bg-white border border-gray-200 overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-3 flex justify-between items-center">
            <h3 className="text-white font-medium">SunSafe Assistant</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-orange-600/20"
              onClick={toggleChat}
            >
              <X size={18} />
            </Button>
          </div>

          <div className="flex-1 overflow-hidden p-4">
            <Chat
              className="h-full"
              messages={messages}
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              isGenerating={isLoading}
              stop={stop}
              append={append}
              suggestions={[
                "What's the best SPF rating for daily use?",
                "How often should I reapply sunscreen?",
                "Tips to protect my kids from UV rays?",
              ]}
            />
          </div>
        </div>
      )}
    </>
  );
}
