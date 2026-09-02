import { describe, it, expect } from "vitest";
import { normalizeCustomFields, mockPropose } from "@/lib/ai-core";
import { validateRequired } from "@/lib/validate";
import { generateDemandText } from "@/lib/generate-text";
import { effectiveItemFields, type DemandData, type DemandItem, type FieldDef } from "@/lib/demand-map";

describe("normalizeCustomFields", () => {
  it("sanitiza entradas válidas e ignora as inválidas", () => {
    const raw = [
      { id: "medida", label: "Medida", type: "text", required: true },
      { label: "Sem id vira slug do label", type: "textarea" },
      { label: "Tipo inválido vira text", type: "banana" },
      { type: "text" },
      "não é objeto",
    ];
    const fields = normalizeCustomFields(raw);
    expect(fields).toHaveLength(3);
    expect(fields[0]).toMatchObject({ id: "medida", type: "text", required: true });
    expect(fields[1].type).toBe("textarea");
    expect(fields[2].type).toBe("text");
  });

  it("select sem opções vira texto; teto global respeitado", () => {
    const [f] = normalizeCustomFields([{ label: "Cor", type: "select", required: true }]);
    expect(f.type).toBe("text");
    const raw = Array.from({ length: 30 }, (_, i) => ({
      label: `Sel ${i}`, type: "select", options: ["a"],
      reveal: { a: Array.from({ length: 10 }, (_, j) => ({ label: `sub ${i}-${j}`, type: "text" })) },
    }));
    let total = 0;
    const count = (fs: FieldDef[]) => fs.forEach((x) => { total++; if (x.reveal) Object.values(x.reveal).forEach(count); });
    count(normalizeCustomFields(raw));
    expect(total).toBeLessThanOrEqual(40);
  });

  it("garante ids únicos entre níveis de reveal", () => {
    const [f] = normalizeCustomFields([
      { id: "cor", label: "Cor", type: "select", options: ["Sim"], reveal: { Sim: [{ id: "cor", label: "Qual cor", type: "text" }] } },
    ]);
    expect(f.reveal?.Sim?.[0].id).not.toBe("cor");
  });
});

describe("mockPropose", () => {
  it("devolve campos técnicos válidos", () => {
    const r = mockPropose("um totem de madeira");
    expect(r.fields.length).toBeGreaterThanOrEqual(3);
    expect(r.fields.some((f) => f.required)).toBe(true);
  });
});

describe("customFields no item", () => {
  const item: DemandItem = {
    id: "i1", typeId: "outros",
    values: { descricao_livre: "Um totem", medidas: "50 x 180 cm" },
    customFields: [
      { id: "medidas", label: "Medidas", type: "text", required: true },
      { id: "cor", label: "Cor", type: "text", required: false },
      { id: "cliente", label: "Colide com campanha", type: "text", required: false },
    ],
  };

  it("effectiveItemFields complementa e descarta colisões", () => {
    const ids = effectiveItemFields(item).map((f) => f.id);
    expect(ids).toContain("descricao_livre");
    expect(ids).toContain("medidas");
    expect(ids).toContain("cor");
    expect(ids).not.toContain("cliente"); // colisão com campanha removida
  });

  it("validação considera obrigatórios dos customFields do item", () => {
    const demand: DemandData = {
      values: { cliente: "X", objetivo: "o", prazo: "2026-09-05", prioridade: "Alta" },
      items: [{ ...item, values: { ...item.values, medidas: "" } }],
    };
    const ids = validateRequired(demand).filter((m) => m.itemId === "i1").map((m) => m.field.id);
    expect(ids).toContain("medidas");
    expect(ids).not.toContain("cor");
  });

  it("o texto final inclui os campos gerados pela IA no bloco do item", () => {
    const demand: DemandData = { values: { cliente: "X" }, items: [item] };
    const text = generateDemandText(demand);
    expect(text).toContain("Medidas: 50 x 180 cm");
    expect(text).toContain("Me conta o que é: Um totem");
  });
});
