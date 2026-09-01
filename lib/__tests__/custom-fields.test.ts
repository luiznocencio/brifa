import { describe, it, expect } from "vitest";
import { normalizeCustomFields, mockPropose } from "@/lib/ai-core";
import { validateRequired } from "@/lib/validate";
import { generateDemandText } from "@/lib/generate-text";
import { effectiveTypeFields, type DemandData, type FieldDef } from "@/lib/demand-map";

describe("normalizeCustomFields", () => {
  it("sanitiza entradas válidas e ignora as inválidas", () => {
    const raw = [
      { id: "medida", label: "Medida", type: "text", required: true },
      { label: "Sem id vira slug do label", type: "textarea" },
      { label: "Tipo inválido vira text", type: "banana" },
      { type: "text" }, // sem label → descartado
      "não é objeto", // descartado
    ];
    const fields = normalizeCustomFields(raw);
    expect(fields).toHaveLength(3);
    expect(fields[0]).toMatchObject({ id: "medida", label: "Medida", type: "text", required: true });
    expect(fields[1].id).toBe("sem_id_vira_slug_do_label");
    expect(fields[1].type).toBe("textarea");
    expect(fields[2].type).toBe("text"); // tipo inválido coagido
  });

  it("retorna [] para não-arrays", () => {
    expect(normalizeCustomFields(null)).toEqual([]);
    expect(normalizeCustomFields({})).toEqual([]);
    expect(normalizeCustomFields("x")).toEqual([]);
  });

  it("garante ids únicos e preserva options só em select", () => {
    const fields = normalizeCustomFields([
      { id: "cor", label: "Cor A", type: "select", options: ["Azul", "Verde", ""] },
      { id: "cor", label: "Cor B", type: "text" },
    ]);
    expect(fields).toHaveLength(2);
    expect(fields[0].id).not.toBe(fields[1].id);
    expect(fields[0].options).toEqual(["Azul", "Verde"]);
    expect(fields[1].options).toBeUndefined();
  });

  it("limita a quantidade de campos (teto)", () => {
    const raw = Array.from({ length: 30 }, (_, i) => ({ label: `Campo ${i}`, type: "text" }));
    expect(normalizeCustomFields(raw).length).toBeLessThanOrEqual(12);
  });
});

describe("mockPropose", () => {
  it("devolve um conjunto útil de campos técnicos válidos", () => {
    const r = mockPropose("um totem de madeira para o hall");
    expect(r.fields.length).toBeGreaterThanOrEqual(3);
    expect(r.fields.some((f) => f.required)).toBe(true);
    const valid = ["text", "textarea", "select", "number", "date"];
    expect(r.fields.every((f) => valid.includes(f.type))).toBe(true);
  });
});

describe("customFields no formulário/validação/texto", () => {
  const demand: DemandData = {
    typeId: "outros",
    values: {
      cliente: "Cliente X",
      objetivo: "Algo diferente",
      prazo: "2026-09-10",
      prioridade: "Alta",
      descricao_livre: "Um totem de madeira",
      medidas: "50 x 180 cm",
    },
    customFields: [
      { id: "medidas", label: "Medidas", type: "text", required: true },
      { id: "cor", label: "Cor", type: "text", required: false },
    ],
  };

  it("effectiveTypeFields complementa: descrição estática + campos da IA", () => {
    const ids = effectiveTypeFields(demand).map((f) => f.id);
    expect(ids).toContain("descricao_livre"); // estático do tipo outros
    expect(ids).toContain("medidas"); // custom
    expect(ids).toContain("cor"); // custom
  });

  it("validação considera obrigatórios dos customFields", () => {
    const semMedida: DemandData = { ...demand, values: { ...demand.values, medidas: "" } };
    const missing = validateRequired(semMedida).map((f) => f.id);
    expect(missing).toContain("medidas");
    expect(missing).not.toContain("cor");
  });

  it("o texto final inclui os campos gerados pela IA", () => {
    const text = generateDemandText(demand);
    expect(text).toContain("Medidas: 50 x 180 cm");
    expect(text).toContain("Descrição da demanda: Um totem de madeira");
  });
});

describe("normalizeCustomFields — robustez (pós-review)", () => {
  it("select sem opções válidas vira campo de texto", () => {
    const [f] = normalizeCustomFields([{ label: "Cor", type: "select", required: true }]);
    expect(f.type).toBe("text");
    expect(f.options).toBeUndefined();
  });

  it("garante ids únicos entre níveis de reveal", () => {
    const [f] = normalizeCustomFields([
      {
        id: "cor", label: "Cor", type: "select", options: ["Sim"],
        reveal: { Sim: [{ id: "cor", label: "Qual cor", type: "text" }] },
      },
    ]);
    expect(f.id).toBe("cor");
    expect(f.reveal?.Sim?.[0].id).not.toBe("cor");
  });

  it("impõe um teto GLOBAL de campos mesmo com reveal aninhado", () => {
    const raw = Array.from({ length: 30 }, (_, i) => ({
      label: `Sel ${i}`, type: "select", options: ["a"],
      reveal: { a: Array.from({ length: 10 }, (_, j) => ({ label: `sub ${i}-${j}`, type: "text" })) },
    }));
    let total = 0;
    const count = (fs: FieldDef[]) =>
      fs.forEach((f) => {
        total++;
        if (f.reveal) Object.values(f.reveal).forEach(count);
      });
    count(normalizeCustomFields(raw));
    expect(total).toBeLessThanOrEqual(40);
  });
});

describe("effectiveTypeFields — dedup base × custom (pós-review)", () => {
  it("descarta campo da IA que colide com id do tronco ou do tipo", () => {
    const demand: DemandData = {
      typeId: "outros",
      values: {},
      customFields: [
        { id: "descricao_livre", label: "Colide com estático", type: "text", required: false },
        { id: "cliente", label: "Colide com tronco", type: "text", required: false },
        { id: "unico", label: "Campo novo", type: "text", required: false },
      ],
    };
    const ids = effectiveTypeFields(demand).map((f) => f.id);
    expect(ids.filter((id) => id === "descricao_livre")).toHaveLength(1); // só o estático
    expect(ids).not.toContain("cliente"); // colisão com tronco removida
    expect(ids).toContain("unico");
  });
});
