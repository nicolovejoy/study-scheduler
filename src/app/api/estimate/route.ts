import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { TextPart, ImagePart, FilePart } from "ai";

const schema = z.object({
  estimatedMinutes: z
    .number()
    .describe("Estimated minutes to complete the assignment"),
  reasoning: z
    .string()
    .describe("Brief explanation of the estimate"),
});

export async function POST(req: Request) {
  const { description, fileData, fileName, fileMimeType } = await req.json();

  const content: Array<TextPart | ImagePart | FilePart> = [];

  if (description?.trim()) {
    content.push({ type: "text", text: description });
  }

  if (fileData && fileMimeType) {
    if (fileMimeType.startsWith("image/")) {
      content.push({ type: "image", image: fileData, mediaType: fileMimeType });
    } else if (fileMimeType === "application/pdf") {
      content.push({
        type: "file",
        data: fileData,
        mediaType: "application/pdf",
        filename: fileName ?? undefined,
      });
    }
  }

  if (content.length === 0) {
    return Response.json({ error: "No content provided" }, { status: 400 });
  }

  const { output } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    output: Output.object({ schema }),
    system:
      "You are a study time estimator for college students. Given an assignment description, estimate how many minutes it will take an average college student to complete. Be realistic — students tend to underestimate. Return your estimate and a brief reasoning.",
    messages: [{ role: "user", content }],
    providerOptions: {
      anthropic: fileMimeType === "application/pdf"
        ? { anthropicBeta: ["pdfs-2024-09-25"] }
        : {},
    },
  });

  return Response.json(output);
}
