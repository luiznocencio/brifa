import { describe, it, expect } from "vitest";
import { validateRequired } from "@/lib/validate";
import type { DemandData } from "@/lib/demand-map";

describe("validateRequired", () => {
  it("aponta obrigatórios vazios do tronco e do galho", () => {
    const demand: DemandData = { typeId: "offline-sinalizacao", values: {} };
    const missing = validateRequired(demand).map((f) => f.id);
    // tronco obrigatórios
    expect(missing).toContain("cliente");
    expect(missing).toContain("objetivo");
    expect(missing).toContain("prazo");
    expect(missing).toContain("prioridade");
    // galho offline obrigatórios
    expect(missing).toContain("medida_real");
    expect(missing).toContain("quantidade");
    expect(missing).toContain("aplicacao_local");
  });

  it("ignora campos opcionais", () => {
    const demand: DemandData = { typeId: "offline-sinalizacao", values: {} };
    const missing = validateRequired(demand).map((f) => f.id);
    expect(missing).not.toContain("publico");
    expect(missing).not.toContain("observacoes");
    expect(missing).not.toContain("acabamento");
  });

  it("trata string só de espaços como vazio", () => {
    const demand: DemandData = {
      typeId: "outros",
      values: { descricao_livre: "   " },
    };
    const missing = validateRequired(demand).map((f) => f.id);
    expect(missing).toContain("descricao_livre");
  });

  it("retorna lista vazia quando tudo obrigatório está preenchido", () => {
    const demand: DemandData = {
      typeId: "outros",
      values: {
        cliente: "Loja X",
        objetivo: "Divulgar inauguração",
        prazo: "2026-09-05",
        prioridade: "Alta",
        descricao_livre: "Precisa de um material simples",
      },
    };
    expect(validateRequired(demand)).toEqual([]);
  });
});
