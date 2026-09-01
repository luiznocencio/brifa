import type { DemandData } from "@/lib/demand-map";
import type { InterpretResult, ReviewResult, RedactResult, ProposeResult } from "@/lib/ai-core";
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

export async function aiPropose(freeText: string): Promise<ProposeResult> {
  try {
    return await post<ProposeResult>({ action: "propose", freeText });
  } catch {
    // Fallback local: um conjunto mínimo de campos técnicos, pra nunca travar.
    return {
      label: freeText.trim().slice(0, 60) || "Demanda personalizada",
      fields: [
        { id: "descricao_detalhada", label: "Descrição detalhada", type: "textarea", required: true, placeholder: "Ex.: o que é, para que serve e o contexto" },
        { id: "dimensoes_ou_formato", label: "Dimensões / Formato", type: "text", required: false, placeholder: "Ex.: 100 x 50 cm, A4" },
        { id: "quantidade", label: "Quantidade", type: "number", required: false, placeholder: "Ex.: 1" },
      ],
    };
  }
}
