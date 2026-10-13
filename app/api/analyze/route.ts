import { analyzeOffer } from "@/lib/ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { sourceText } = (await request.json()) as { sourceText?: string };
    const text = sourceText?.trim() ?? "";

    if (text.length < 20) {
      return NextResponse.json(
        { error: "Paste a fuller offer — at least a sentence or two." },
        { status: 400 },
      );
    }

    const result = await analyzeOffer(text);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analyze failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
