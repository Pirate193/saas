
import { convertToModelMessages, streamText } from "ai";
import { toolDefinitionsToToolSet } from "@blocknote/xl-ai";
import { google } from "@ai-sdk/google";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, toolDefinitions } = await req.json();

  const result = streamText({
    model: google('gemini-2.0-flash') ,
    messages: convertToModelMessages(messages),
    tools: toolDefinitionsToToolSet(toolDefinitions),
    toolChoice: "required",
  });

  return result.toUIMessageStreamResponse();
}