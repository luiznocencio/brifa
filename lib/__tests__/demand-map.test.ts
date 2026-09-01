import { describe, it, expect } from "vitest";
import {
  TRUNK_FIELDS,
  DEMAND_TYPES,
  getTypeById,
  getFieldsForType,
} from "@/lib/demand-map";

describe("mapa técnico", () => {
  it("tronco comum tem os campos-chave obrigatórios", () => {
    const ids = TRUNK_FIELDS.map((f) => f.id);
    for (const id of ["cliente", "solicitante", "objetivo", "prazo", "prioridade"]) {
      const f = TRUNK_FIELDS.find((x) => x.id === id);
      expect(f, `campo ${id} existe`).toBeTruthy();
      expect(f!.required, `campo ${id} é obrigatório`).toBe(true);
    }
    expect(ids).toContain("aprovador");
    expect(ids).toContain("publico");
    expect(ids).toContain("observacoes");
  });

  it("inclui os 6 subtipos de produções offline", () => {
    const offline = DEMAND_TYPES.filter((t) => t.category === "Produções Offline");
    expect(offline.length).toBe(6);
    const labels = offline.map((t) => t.label.toLowerCase());
    expect(labels.some((l) => l.includes("sinaliza"))).toBe(true);
    expect(labels.some((l) => l.includes("pdv") || l.includes("trade"))).toBe(true);
    expect(labels.some((l) => l.includes("evento") || l.includes("ativa"))).toBe(true);
    expect(labels.some((l) => l.includes("grande"))).toBe(true);
    expect(labels.some((l) => l.includes("brinde") || l.includes("merch"))).toBe(true);
    expect(labels.some((l) => l.includes("impress"))).toBe(true);
  });

  it("todo tipo offline exige medida real, quantidade e aplicação/local", () => {
    const offline = DEMAND_TYPES.filter((t) => t.category === "Produções Offline");
    for (const t of offline) {
      const ids = t.fields.map((f) => f.id);
      expect(ids, `${t.label} tem medida_real`).toContain("medida_real");
      expect(ids, `${t.label} tem quantidade`).toContain("quantidade");
      expect(ids, `${t.label} tem aplicacao_local`).toContain("aplicacao_local");
    }
  });

  it("ids de campo são únicos dentro de cada tipo (tronco + galho)", () => {
    for (const t of DEMAND_TYPES) {
      const ids = getFieldsForType(t.id).map((f) => f.id);
      expect(new Set(ids).size, `${t.label} sem ids duplicados`).toBe(ids.length);
    }
  });

  it("getTypeById e getFieldsForType funcionam", () => {
    const t = DEMAND_TYPES[0];
    expect(getTypeById(t.id)?.id).toBe(t.id);
    expect(getTypeById("inexistente")).toBeUndefined();
    const fields = getFieldsForType(t.id);
    expect(fields.length).toBe(TRUNK_FIELDS.length + t.fields.length);
    // tronco vem primeiro
    expect(fields[0].id).toBe(TRUNK_FIELDS[0].id);
  });

  it("existe um tipo de fallback 'Outros'", () => {
    expect(DEMAND_TYPES.some((t) => t.category === "Outros")).toBe(true);
  });
});
