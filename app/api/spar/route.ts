import { continueSpar, startSpar } from "@/lib/ai";
import type { AnalysisResult, SparTurn } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      sourceText?: string;
      brief?: AnalysisResult;
      history?: SparTurn[];
      userReply?: string;
    };

    const sourceText = body.sourceText?.trim() ?? "";
    const brief = body.brief;

    if (!sourceText || !brief?.target) {
      return NextResponse.json(
        { error: "Analyze an offer before sparring." },
        { status: 400 },
      );
    }

    const userReply = body.userReply?.trim() ?? "";
    const history = Array.isArray(body.history) ? body.history : [];

    if (!userReply) {
      const started = await startSpar({ sourceText, brief });
      return NextResponse.json(started);
    }

    const continued = await continueSpar({
      sourceText,
      brief,
      history,
      userReply,
    });
    return NextResponse.json(continued);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Spar failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
