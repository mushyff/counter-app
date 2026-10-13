import type { AnalysisResult, SparResponse, SparTurn } from "./types";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1] ?? trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Model did not return JSON.");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

async function complete(options: {
  system: string;
  user: string;
  temperature?: number;
}): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      "Missing OPENAI_API_KEY. Add it to .env.local and restart the dev server.",
    );
  }

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: options.temperature ?? 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: options.system },
        { role: "user", content: options.user },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`AI request failed (${res.status}): ${detail.slice(0, 240)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty AI response.");
  }
  return content;
}

function briefBlock(brief: AnalysisResult): string {
  return [
    `Walk-away: ${brief.walkAway}`,
    `Target: ${brief.target}`,
    `Stretch: ${brief.stretch}`,
    `5-year cost of first offer: ${brief.fiveYearCost}`,
    brief.fiveYearCostNote ? `Note: ${brief.fiveYearCostNote}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

const ANALYZE_SYSTEM = `You are COUNTER, an expert negotiation analyst. Your job is to stop people from accepting the first number.

ANALYZE IN THIS ORDER:
1. Extract the offer carefully: primary number, currency, unit (salary / hourly / day rate / monthly rent / project bid / etc.), role or asset, location if present, benefits or extras, and any constraints.
2. Identify offer type: salary | hourly | freelance | rent | bid | other.
3. Anchor numbers to that extracted offer — never invent a different base figure.
4. Produce realistic negotiation bands:
   - walkAway: firm floor — defensible, not fantasy.
   - target: serious ask — typically ~8–18% better than first offer for compensation; for rent/purchases you pay, target is lower.
   - stretch: ambitious but credible — typically ~15–30% better, not cartoonish.
5. Compute fiveYearCost as the approximate multi-year dollar cost of accepting the FIRST number instead of TARGET. State method in fiveYearCostNote.
6. Write counterScript: professional, confident, warm but firm, no apology, no emojis. Ask for TARGET. Ready to send.

RULES:
- Never recommend taking the first number.
- Match units to the offer.
- Return JSON only with keys: walkAway, target, stretch, fiveYearCost, fiveYearCostNote, counterScript.`;

export async function analyzeOffer(sourceText: string): Promise<AnalysisResult> {
  const content = await complete({
    system: ANALYZE_SYSTEM,
    user: `Analyze this offer and return the JSON result.\n\n---\n${sourceText}\n---`,
    temperature: 0.25,
  });

  const parsed = extractJson(content) as Partial<AnalysisResult>;
  if (
    !parsed.walkAway ||
    !parsed.target ||
    !parsed.stretch ||
    !parsed.fiveYearCost ||
    !parsed.counterScript
  ) {
    throw new Error("Incomplete analysis.");
  }

  return {
    walkAway: String(parsed.walkAway),
    target: String(parsed.target),
    stretch: String(parsed.stretch),
    fiveYearCost: String(parsed.fiveYearCost),
    fiveYearCostNote: String(parsed.fiveYearCostNote ?? ""),
    counterScript: String(parsed.counterScript),
  };
}

export async function regenerateScript(input: {
  sourceText: string;
  brief: AnalysisResult;
}): Promise<string> {
  const content = await complete({
    system: `You are COUNTER. Rewrite only the counter script for this negotiation.
Keep the locked numbers exactly — do not change walk-away, target, stretch, or 5-year cost.
Ask for the TARGET number. Professional, confident, firm, no apology, no emojis, ready to send.
Make this version meaningfully different in wording/structure from the previous script.
Return JSON only: { "counterScript": string }`,
    user: `Original offer:\n${input.sourceText}\n\nLocked numbers:\n${briefBlock(input.brief)}\n\nPrevious script (do not repeat):\n${input.brief.counterScript}`,
    temperature: 0.7,
  });

  const parsed = extractJson(content) as { counterScript?: string };
  if (!parsed.counterScript) {
    throw new Error("Could not regenerate script.");
  }
  return String(parsed.counterScript);
}

export async function startSpar(input: {
  sourceText: string;
  brief: AnalysisResult;
}): Promise<SparResponse> {
  const content = await complete({
    system: `You are sparring for COUNTER. Play the other side of this negotiation (hiring manager, landlord, client, buyer, etc. — infer from context).
Open with a common, realistic first pushback against their counter. Stay in character. 2–5 sentences. No coaching yet.
Return JSON only: { "opponentMessage": string }`,
    user: `Offer / context:\n${input.sourceText}\n\nTheir locked numbers:\n${briefBlock(input.brief)}\n\nThey are practicing countering toward the TARGET.`,
    temperature: 0.55,
  });

  const parsed = extractJson(content) as Partial<SparResponse>;
  if (!parsed.opponentMessage) {
    throw new Error("Could not start sparring.");
  }
  return { opponentMessage: String(parsed.opponentMessage) };
}

export async function continueSpar(input: {
  sourceText: string;
  brief: AnalysisResult;
  history: SparTurn[];
  userReply: string;
}): Promise<SparResponse> {
  const transcript = input.history
    .map((turn) => {
      const who = turn.role === "opponent" ? "Other side" : "User";
      return `${who}: ${turn.content}`;
    })
    .join("\n\n");

  const content = await complete({
    system: `You are sparring for COUNTER in two roles:
1) Opponent: stay in character as the other side (hiring manager, landlord, client, etc.). Respond realistically to the user's latest reply — push back, probe, or concede slightly if they held firm well. 2–5 sentences.
2) Coach: after their reply, provide:
   - coachingNote: one short sentence of feedback on how they did (praise if strong, blunt if they leaked leverage).
   - suggestedReplies: array of 1–2 ready-to-send next replies that hold toward TARGET, confident and firm, no apology. Each should be a full message the user could send next against the opponent's upcoming pushback.
Never recommend taking the first number.
Return JSON only: { "opponentMessage": string, "coachingNote": string, "suggestedReplies": string[] }`,
    user: `Offer / context:\n${input.sourceText}\n\nLocked numbers:\n${briefBlock(input.brief)}\n\nTranscript so far:\n${transcript || "(none)"}\n\nUser's latest reply:\n${input.userReply}`,
    temperature: 0.55,
  });

  const parsed = extractJson(content) as Partial<SparResponse>;
  if (!parsed.opponentMessage) {
    throw new Error("Could not continue sparring.");
  }

  const suggestions = Array.isArray(parsed.suggestedReplies)
    ? parsed.suggestedReplies
        .map((item) => String(item).trim())
        .filter(Boolean)
        .slice(0, 2)
    : [];

  return {
    opponentMessage: String(parsed.opponentMessage),
    coachingNote: String(
      parsed.coachingNote ?? "Hold the line. Do not take the first number.",
    ),
    suggestedReplies:
      suggestions.length > 0
        ? suggestions
        : [
            `I appreciate the context — I still need to land at ${input.brief.target} to move forward.`,
          ],
  };
}
