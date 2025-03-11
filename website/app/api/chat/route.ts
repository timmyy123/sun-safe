import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { z } from "zod";

// Enable edge runtime for streaming
export const runtime = "edge";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    console.log("Received messages:", messages);

    // If you have a system prompt, uncomment:
    messages.unshift({
      role: "system",
      content: "You are SunSafe AI, an expert in sun safety and dermatology..."
    });

    const result = streamText({
      model: google("gemini-2.0-flash", {
        // If needed, add settings here, e.g. safetySettings
        // safetySettings: [
        //   { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        // ],
      }),
      messages,
    });


    console.log("streamText call succeeded, returning stream...");

    // Return streaming response
    console.log(result.toDataStreamResponse())
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in /api/chat route:", error);

    // Return a 500 JSON response with the error message
    return new Response(
      JSON.stringify({
        error: (error as Error)?.message || "Unknown Error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}