import { describe, it, expect } from "vitest";
import { validateRequired } from "@/lib/validate";
import type { DemandData } from "@/lib/demand-map";

describe("validateRequired (campanha + itens)", () => {
  it("aponta obrigatórios de campanha e de item, com o itemId", () => {
    const demand: DemandData = { values: {}, items: [{ id: "i1", typeId: "offline-sinalizacao", values: {} }] };
    const missing = validateRequired(demand);
    const campIds = missing.filter((m) => m.itemId === null).map((m) => m.field.id);
    expect(campIds).toEqual(expect.arrayContaining(["cliente", "objetivo", "prazo", "prioridade"]));
    const itemIds = missing.filter((m) => m.itemId === "i1").map((m) => m.field.id);
    expect(itemIds).toEqual(expect.arrayContaining(["medida_real", "quantidade", "aplicacao_local"]));
  });

  it("item sem tipo é sinalizado com __tipo", () => {
    const demand: DemandData = { values: {}, items: [{ id: "i1", typeId: "", values: {} }] };
    const ids = validateRequired(demand).filter((m) => m.itemId === "i1").map((m) => m.field.id);
    expect(ids).toContain("__tipo");
  });

  it("lista vazia quando tudo obrigatório está preenchido", () => {
    const demand: DemandData = {
      values: { cliente: "X", objetivo: "o", prazo: "2026-09-05", prioridade: "Alta" },
      items: [{ id: "i1", typeId: "outros", values: { descricao_livre: "algo" } }],
    };
    expect(validateRequired(demand)).toEqual([]);
  });

  it("prioridade Urgente exige Motivo da urgência (campanha)", () => {
    const demand: DemandData = { values: { prioridade: "Urgente" }, items: [] };
    expect(validateRequired(demand).map((m) => m.field.id)).toContain("motivo_urgencia");
  });
});
