import { describe, it, expect } from "vitest";
import {
  CAMPAIGN_FIELDS,
  DEMAND_TYPES,
  getTypeById,
  getCategories,
  typesInCategory,
  categoryOfType,
  newItem,
  campaignVisibleFields,
  itemVisibleFields,
  effectiveItemFields,
} from "@/lib/demand-map";

describe("mapa técnico", () => {
  it("campos de campanha têm os obrigatórios-chave (e não têm solicitante/aprovador)", () => {
    for (const id of ["cliente", "objetivo", "prazo", "prioridade"]) {
      const f = CAMPAIGN_FIELDS.find((x) => x.id === id);
      expect(f, id).toBeTruthy();
      expect(f!.required).toBe(true);
    }
    const ids = CAMPAIGN_FIELDS.map((f) => f.id);
    expect(ids).toContain("publico");
    expect(ids).toContain("observacoes");
    expect(ids).not.toContain("solicitante");
    expect(ids).not.toContain("aprovador");
  });

  it("6 subtipos offline, cada um com medida/quantidade/aplicação", () => {
    const offline = DEMAND_TYPES.filter((t) => t.category === "Produções Offline");
    expect(offline.length).toBe(6);
    for (const t of offline) {
      const ids = t.fields.map((f) => f.id);
      expect(ids).toContain("medida_real");
      expect(ids).toContain("quantidade");
      expect(ids).toContain("aplicacao_local");
    }
  });

  it("ids únicos dentro de campanha + tipo", () => {
    for (const t of DEMAND_TYPES) {
      const ids = [...CAMPAIGN_FIELDS.map((f) => f.id), ...t.fields.map((f) => f.id)];
      expect(new Set(ids).size, t.label).toBe(ids.length);
    }
  });

  it("categorias e helpers de cascata funcionam", () => {
    expect(getCategories()).toContain("Impresso / Gráfico");
    expect(typesInCategory("Impresso / Gráfico").length).toBeGreaterThanOrEqual(3);
    const t = DEMAND_TYPES[0];
    expect(categoryOfType(t.id)).toBe(t.category);
    expect(getTypeById(t.id)?.id).toBe(t.id);
    expect(categoryOfType("inexistente")).toBe("");
  });

  it("fallback 'Outros' existe", () => {
    expect(DEMAND_TYPES.some((t) => t.category === "Outros")).toBe(true);
  });

  it("newItem gera item com id único e sem tipo", () => {
    const a = newItem();
    const b = newItem("social-post");
    expect(a.id).not.toBe(b.id);
    expect(a.typeId).toBe("");
    expect(b.typeId).toBe("social-post");
  });

  it("campaignVisibleFields e itemVisibleFields expandem condicionais", () => {
    expect(campaignVisibleFields({ values: { prioridade: "Urgente" }, items: [] }).map((f) => f.id)).toContain("motivo_urgencia");
    const item = { id: "x", typeId: "av-video", values: { locucao: "Sim" } };
    expect(itemVisibleFields(item).map((f) => f.id)).toContain("idioma_locucao");
    expect(effectiveItemFields(item).map((f) => f.id)).toContain("duracao");
    // prazo_item (nível item) entra no visível
    expect(itemVisibleFields(item).map((f) => f.id)).toContain("prazo_item");
  });
});
