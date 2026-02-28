"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import ArrowRightIcon from "@/components/icons/arrow-right";
import AtomIcon from "@/components/icons/atom";
import { cn } from "@/lib/utils";

export function AIChat() {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const isLoading = status === "streaming" || status === "submitted";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput("");
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0">
        <div ref={scrollRef} className="flex flex-col gap-4 pb-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
              <AtomIcon className="size-12 opacity-30" />
              <div className="text-center space-y-1">
                <p className="text-sm font-bold uppercase">
                  Laboratory Ready
                </p>
                <p className="text-xs max-w-sm text-balance">
                  Chat with your AI agent. It has access to your connected
                  services — Gmail, Calendar, Notion, GitHub, Todoist, and more.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {[
                  "What integrations do I have?",
                  "What's on my calendar today?",
                  "Check my latest emails",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      sendMessage({ text: suggestion });
                    }}
                    className="text-xs px-3 py-1.5 rounded-md bg-accent hover:bg-accent/80 text-accent-foreground transition-colors cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="shrink-0 size-7 rounded bg-primary flex items-center justify-center mt-0.5">
                    <AtomIcon className="size-4" />
                  </div>
                )}

                <div
                  className={cn(
                    "flex flex-col gap-2 max-w-[85%]",
                    message.role === "user" && "items-end"
                  )}
                >
                  {message.parts.map((part, i) => {
                    if (part.type === "text" && part.text) {
                      return (
                        <div
                          key={i}
                          className={cn(
                            "rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-accent text-accent-foreground"
                          )}
                        >
                          {part.text}
                        </div>
                      );
                    }

                    if (
                      part.type === "tool-invocation" ||
                      (part as any).type === "dynamic-tool"
                    ) {
                      return <ToolCallPart key={i} part={part as any} />;
                    }

                    return null;
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <div className="shrink-0 size-7 rounded bg-primary flex items-center justify-center">
                <AtomIcon className="size-4" />
              </div>
              <Spinner className="size-4" />
              <span className="text-xs uppercase">Processing...</span>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Error display */}
      {error && (
        <div className="px-3 py-2 text-xs text-destructive bg-destructive/10 rounded-md border border-destructive/20">
          {error.message}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t border-pop">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your AI agent..."
          disabled={isLoading}
          className="flex-1 bg-accent/50"
        />
        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
          {isLoading ? (
            <Spinner className="size-4" />
          ) : (
            <ArrowRightIcon className="size-4" />
          )}
        </Button>
      </form>
    </div>
  );
}

function ToolCallPart({ part }: { part: any }) {
  const toolName = part.toolName || part.toolCallId || "tool";
  const state = part.state || "output-available";

  const isRunning =
    state === "input-streaming" || state === "input-available" || state === "partial-call";
  const isError = state === "output-error";
  const isDone = state === "output-available";

  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer group">
        <Badge
          variant={isError ? "outline-destructive" : isDone ? "outline-success" : "outline"}
          className="gap-1.5"
        >
          {isRunning && <Spinner className="size-3" />}
          {isDone && <span className="text-[10px]">&#10003;</span>}
          {isError && <span className="text-[10px]">&#10007;</span>}
          <span className="font-mono text-[10px]">{toolName}</span>
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 rounded bg-background/50 border border-pop p-2 text-[10px] font-mono overflow-x-auto max-h-40 overflow-y-auto">
          {part.input && (
            <div className="text-muted-foreground">
              <span className="text-primary/70">input: </span>
              {JSON.stringify(part.input, null, 2)}
            </div>
          )}
          {part.output && (
            <div className="mt-1 text-foreground">
              <span className="text-primary/70">output: </span>
              {typeof part.output === "string"
                ? part.output
                : JSON.stringify(part.output, null, 2)}
            </div>
          )}
          {isError && part.error && (
            <div className="mt-1 text-destructive">
              {typeof part.error === "string"
                ? part.error
                : JSON.stringify(part.error, null, 2)}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
