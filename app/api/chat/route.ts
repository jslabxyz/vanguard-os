import {
  streamText,
  UIMessage,
  convertToModelMessages,
  stepCountIs,
} from "ai";
import { createMCPClient } from "@ai-sdk/mcp";
import { Experimental_StdioMCPTransport as StdioMCPTransport } from "@ai-sdk/mcp/mcp-stdio";
import { anthropic } from "@ai-sdk/anthropic";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const mcpClient = await createMCPClient({
    transport: new StdioMCPTransport({
      command: "npx",
      args: ["@picahq/mcp"],
      env: {
        ...(process.env as Record<string, string>),
        PICA_SECRET: process.env.PICA_SECRET!,
      },
    }),
  });

  const tools = await mcpClient.tools();

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: `You are an AI assistant inside M.O.N.K.Y OS — a cyberpunk-themed command center. You have access to the user's connected services through Pica (Gmail, Google Calendar, Notion, GitHub, Todoist, Spotify, and more). Be concise and helpful. When using tools, explain what you're doing briefly. Format responses with markdown when appropriate.`,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
    onFinish: async () => {
      await mcpClient.close();
    },
  });

  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
}
