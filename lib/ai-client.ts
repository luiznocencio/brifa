import type { DemandData } from "@/lib/demand-map";
import type { InterpretResult, ReviewResult, RedactResult } from "@/lib/ai-core";
import { generateDemandText } from "@/lib/generate-text";

async function post<T>(body: unknown): Promise<T> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`IA respondeu ${res.status}`);
  return (await res.json()) as T;
}

export async function aiInterpret(freeText: string): Promise<InterpretResult> {
  return post<InterpretResult>({ action: "interpret", freeText });
}

export async function aiReview(demand: DemandData): Promise<ReviewResult> {
  return post<ReviewResult>({ action: "review", demand });
}

export async function aiRedact(demand: DemandData): Promise<RedactResult> {
  try {
    return await post<RedactResult>({ action: "redact", demand });
  } catch {
    // Nunca trava por IA: gera localmente.
    return { text: generateDemandText(demand) };
  }
}
