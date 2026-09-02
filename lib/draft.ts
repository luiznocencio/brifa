import type { DemandData } from "@/lib/demand-map";

export const DRAFT_KEY = "pauta-demandas:draft";

function storage(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function saveDraft(demand: DemandData): void {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(DRAFT_KEY, JSON.stringify(demand));
  } catch {
    /* quota / modo privado — ignora */
  }
}

export function loadDraft(): DemandData | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && typeof parsed.values === "object" && Array.isArray(parsed.items)) {
      return parsed as DemandData;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  const s = storage();
  if (!s) return;
  try {
    s.removeItem(DRAFT_KEY);
  } catch {
    /* ignora */
  }
}
