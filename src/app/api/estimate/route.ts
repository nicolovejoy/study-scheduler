import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const schema = z.object({
  estimatedMinutes: z
    .number()
    .describe("Estimated minutes to complete the assignment"),
  reasoning: z
    .string()
    .describe("Brief explanation of the estimate"),
});

export async function POST(req: Request) {
  const { description } = await req.json();

  const { output } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    output: Output.object({ schema }),
    system:
      "You are a study time estimator for college students. Given an assignment description, estimate how many minutes it will take an average college student to complete. Be realistic — students tend to underestimate. Return your estimate and a brief reasoning.",
    prompt: description,
  });

  return Response.json(output);
}
