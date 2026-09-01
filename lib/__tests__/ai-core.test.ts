import { describe, it, expect } from "vitest";
import { mockInterpret, mockReview, mockRedact } from "@/lib/ai-core";
import type { DemandData } from "@/lib/demand-map";

describe("ai-core (modo mock)", () => {
  it("mockInterpret detecta offline por palavra-chave", () => {
    const r = mockInterpret("Cliente quer um adesivo pra fachada da loja nova");
    expect(r.typeId.startsWith("offline")).toBe(true);
    expect(Array.isArray(r.unmatched)).toBe(true);
  });

  it("mockInterpret cai em 'outros' quando não reconhece", () => {
    const r = mockInterpret("algo totalmente indefinido xyz");
    expect(r.typeId).toBe("outros");
  });

  it("mockReview lista as lacunas obrigatórias como frases legíveis", () => {
    const demand: DemandData = { typeId: "offline-sinalizacao", values: {} };
    const r = mockReview(demand);
    expect(r.gaps.length).toBeGreaterThan(0);
    expect(r.gaps.join(" ")).toContain("Medida real");
  });

  it("mockReview retorna zero lacunas quando completo", () => {
    const demand: DemandData = {
      typeId: "outros",
      values: {
        cliente: "X", solicitante: "Ana", objetivo: "obj",
        prazo: "2026-09-05", prioridade: "Alta", descricao_livre: "ok",
      },
    };
    expect(mockReview(demand).gaps).toEqual([]);
  });

  it("mockRedact devolve o texto padronizado", () => {
    const demand: DemandData = { typeId: "social-post", values: { cliente: "X" } };
    const r = mockRedact(demand);
    expect(r.text.startsWith("SOLICITACAO DE DEMANDA")).toBe(true);
  });
});
