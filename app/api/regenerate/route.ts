import { regenerateScript } from "@/lib/ai";
import type { AnalysisResult } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      sourceText?: string;
      brief?: AnalysisResult;
    };

    const sourceText = body.sourceText?.trim() ?? "";
    const brief = body.brief;

    if (!sourceText || !brief?.target || !brief?.counterScript) {
      return NextResponse.json(
        { error: "Analysis context required to regenerate." },
        { status: 400 },
      );
    }

    const counterScript = await regenerateScript({ sourceText, brief });
    return NextResponse.json({ counterScript });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Regenerate failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
