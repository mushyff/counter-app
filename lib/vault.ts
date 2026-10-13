import type { AnalysisResult, VaultEntry } from "./types";

const STORAGE_KEY = "counter.vault.v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readAll(): VaultEntry[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VaultEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry) =>
        entry &&
        typeof entry.id === "string" &&
        typeof entry.createdAt === "string" &&
        typeof entry.sourceText === "string" &&
        entry.brief &&
        typeof entry.brief.target === "string",
    );
  } catch {
    return [];
  }
}

function writeAll(entries: VaultEntry[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function listVaultEntries(): VaultEntry[] {
  return readAll().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getVaultEntry(id: string): VaultEntry | null {
  return readAll().find((entry) => entry.id === id) ?? null;
}

export function saveToVault(
  sourceText: string,
  brief: AnalysisResult,
): VaultEntry {
  const entry: VaultEntry = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `vault-${Date.now()}`,
    createdAt: new Date().toISOString(),
    sourceText,
    brief,
  };
  const next = [entry, ...readAll()];
  writeAll(next);
  return entry;
}

export function deleteVaultEntry(id: string): void {
  writeAll(readAll().filter((entry) => entry.id !== id));
}

export function previewOffer(text: string, max = 72): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1)}…`;
}
