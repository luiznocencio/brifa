import { describe, it, expect } from "vitest";
import { mockInterpret, mockReview, mockRedact } from "@/lib/ai-core";
import type { DemandData } from "@/lib/demand-map";

describe("ai-core (modo mock)", () => {
  it("mockInterpret cria um item com o tipo detectado", () => {
    const r = mockInterpret("um panfleto para a inauguração");
    expect(r.items.length).toBe(1);
    expect(r.items[0].typeId).toBe("impresso-panfleto");
    expect(typeof r.campaignValues).toBe("object");
  });

  it("mockInterpret cai em 'outros' quando não reconhece", () => {
    expect(mockInterpret("algo totalmente indefinido xyz").items[0].typeId).toBe("outros");
  });

  it("mockReview lista as lacunas como frases legíveis", () => {
    const demand: DemandData = { values: {}, items: [{ id: "i1", typeId: "offline-sinalizacao", values: {} }] };
    const gaps = mockReview(demand).gaps;
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps.join(" ")).toContain("Medida real");
  });

  it("mockReview retorna zero lacunas quando completo", () => {
    const demand: DemandData = {
      values: { cliente: "X", objetivo: "o", prazo: "2026-09-05", prioridade: "Alta" },
      items: [{ id: "i1", typeId: "outros", values: { descricao_livre: "x" } }],
    };
    expect(mockReview(demand).gaps).toEqual([]);
  });

  it("mockRedact devolve o texto padronizado", () => {
    const demand: DemandData = { values: { cliente: "X" }, items: [] };
    expect(mockRedact(demand).text.startsWith("SOLICITACAO DE DEMANDA")).toBe(true);
  });
});
