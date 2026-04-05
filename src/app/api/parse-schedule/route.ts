import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const schema = z.object({
  blocks: z.array(
    z.object({
      day: z.enum([
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ]),
      start: z.string().describe("24h HH:MM format, e.g. 09:00"),
      end: z.string().describe("24h HH:MM format, e.g. 11:30"),
    })
  ),
});

export async function POST(req: Request) {
  const { fileData, fileMimeType } = await req.json();

  if (!fileData || !fileMimeType) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const { output } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    output: Output.object({ schema }),
    system: `You are reading a weekly calendar screenshot.
Identify all busy blocks (classes, appointments, commitments) shown on the calendar.
Then return the FREE windows between those busy blocks for each day of the week, within typical study hours (7am–11pm).
Only return windows of at least 30 minutes.
If a day has no events, return the full 7am–11pm window for that day.
Use 24-hour HH:MM format for times (e.g. 09:00, 13:30, 23:00).
Use lowercase full day names (monday, tuesday, etc.).`,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Here is my weekly calendar. Please extract my free study windows.",
          },
          {
            type: "image",
            image: fileData,
            mediaType: fileMimeType as "image/png" | "image/jpeg" | "image/webp" | "image/gif",
          },
        ],
      },
    ],
  });

  return Response.json(output);
}
