export type AnalysisResult = {
  walkAway: string;
  target: string;
  stretch: string;
  fiveYearCost: string;
  fiveYearCostNote: string;
  counterScript: string;
};

export type VaultEntry = {
  id: string;
  createdAt: string;
  sourceText: string;
  brief: AnalysisResult;
};

export type SparTurn = {
  role: "opponent" | "user";
  content: string;
  coachingNote?: string;
  suggestedReplies?: string[];
};

export type SparResponse = {
  opponentMessage: string;
  coachingNote?: string;
  suggestedReplies?: string[];
};
