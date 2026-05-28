import { createServerFn } from "@tanstack/react-start";

type Msg = { role: "system" | "user" | "assistant"; content: string };

const SYSTEM_PROMPTS: Record<string, string> = {
  email:
    "You are AuraFlow AI's Email expert. Draft, rewrite, and polish professional emails. Be concise, warm, and tone-aware. When asked, offer a subject line and a short version.",
  meeting:
    "You are AuraFlow AI's Meeting analyst. Summarize transcripts and notes into: 1) TL;DR, 2) Key decisions, 3) Action items with owners & deadlines, 4) Open questions. Use crisp bullets.",
  tasks:
    "You are AuraFlow AI's Productivity planner. Build realistic schedules and prioritized to-do lists. Use time blocks, energy-aware ordering, and short rationale.",
  research:
    "You are AuraFlow AI's Research assistant. Provide structured briefings with headings, bullets, and a closing 'Sources to verify' note. Flag uncertainty honestly.",
  general:
    "You are AuraFlow AI — an elegant workplace productivity assistant. Be friendly, concise, and helpful. Always indicate when content is AI-generated.",
};

export const sendChat = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { workspace: string; messages: Msg[] }) => d,
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const system =
      SYSTEM_PROMPTS[data.workspace] ?? SYSTEM_PROMPTS.general;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, ...data.messages],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits to continue.");
      throw new Error(`AI request failed: ${text}`);
    }

    const json = await res.json();
    const reply: string = json.choices?.[0]?.message?.content ?? "";
    return { reply };
  });
