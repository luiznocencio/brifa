import { describe, it, expect } from "vitest";
import { expandFields, getFieldsForDemand, type FieldDef, type DemandData } from "@/lib/demand-map";
import { validateRequired } from "@/lib/validate";
import { generateDemandText } from "@/lib/generate-text";
import { normalizeCustomFields } from "@/lib/ai-core";

describe("condicional universal do tronco: Prioridade = Urgente", () => {
  it("não revela Motivo da urgência com prioridade normal", () => {
    const d: DemandData = { typeId: "social-post", values: { prioridade: "Alta" } };
    expect(getFieldsForDemand(d).map((f) => f.id)).not.toContain("motivo_urgencia");
  });

  it("revela e exige Motivo da urgência quando Urgente", () => {
    const d: DemandData = { typeId: "social-post", values: { prioridade: "Urgente" } };
    expect(getFieldsForDemand(d).map((f) => f.id)).toContain("motivo_urgencia");
    // é obrigatório: com o motivo vazio, entra nas lacunas
    expect(validateRequired(d).map((f) => f.id)).toContain("motivo_urgencia");
  });
});

const withReveal: FieldDef[] = [
  {
    id: "a", label: "A", type: "select", required: false, options: ["x", "y"],
    reveal: {
      x: [
        {
          id: "a_x", label: "A-X", type: "select", required: false, options: ["p"],
          reveal: { p: [{ id: "a_x_p", label: "A-X-P", type: "text", required: false }] },
        },
      ],
    },
  },
  { id: "b", label: "B", type: "text", required: false },
];

describe("expandFields (condicionais em cascata)", () => {
  it("não revela nada quando o valor não casa", () => {
    expect(expandFields(withReveal, {}).map((f) => f.id)).toEqual(["a", "b"]);
    expect(expandFields(withReveal, { a: "y" }).map((f) => f.id)).toEqual(["a", "b"]);
  });

  it("revela o campo condicional logo após o controlador", () => {
    expect(expandFields(withReveal, { a: "x" }).map((f) => f.id)).toEqual(["a", "a_x", "b"]);
  });

  it("expande recursivamente (campo revelado revela outro)", () => {
    expect(expandFields(withReveal, { a: "x", a_x: "p" }).map((f) => f.id)).toEqual([
      "a",
      "a_x",
      "a_x_p",
      "b",
    ]);
  });
});

describe("validação ignora campos condicionais ocultos", () => {
  const base = {
    cliente: "X",
    objetivo: "o",
    prazo: "2026-09-05",
    prioridade: "Alta",
    descricao_livre: "d",
  };
  const custom: FieldDef[] = [
    {
      id: "tem_x", label: "Tem X?", type: "select", required: false, options: ["Sim", "Não"],
      reveal: { Sim: [{ id: "detalhe_x", label: "Detalhe X", type: "text", required: true }] },
    },
  ];

  it("campo obrigatório oculto não entra nas lacunas", () => {
    const demand: DemandData = { typeId: "outros", values: { ...base }, customFields: custom };
    expect(validateRequired(demand).map((f) => f.id)).not.toContain("detalhe_x");
  });

  it("ao selecionar a opção, o obrigatório revelado passa a ser exigido", () => {
    const demand: DemandData = {
      typeId: "outros",
      values: { ...base, tem_x: "Sim" },
      customFields: custom,
    };
    expect(validateRequired(demand).map((f) => f.id)).toContain("detalhe_x");
  });
});

describe("generate-text respeita os condicionais", () => {
  it("inclui o campo revelado quando ativo e exclui quando oculto", () => {
    const ativo: DemandData = {
      typeId: "av-video",
      values: {
        cliente: "X", objetivo: "o", prazo: "2026-09-05", prioridade: "Alta",
        duracao: "60s", proporcao: "16:9",
        locucao: "Sim", idioma_locucao: "Português BR",
      },
    };
    const textoAtivo = generateDemandText(ativo);
    expect(textoAtivo).toContain("Idioma da locução: Português BR");

    // Mesmo com valor preenchido, se a locução for "Não" o campo fica oculto.
    const oculto: DemandData = {
      ...ativo,
      values: { ...ativo.values, locucao: "Não" },
    };
    expect(generateDemandText(oculto)).not.toContain("Idioma da locução");
  });
});

describe("normalizeCustomFields entende reveal aninhado", () => {
  it("sanitiza os campos condicionais recursivamente", () => {
    const fields = normalizeCustomFields([
      {
        label: "Seletor", type: "select", options: ["a"],
        reveal: { a: [{ label: "Subcampo", type: "text" }] },
      },
    ]);
    expect(fields).toHaveLength(1);
    expect(fields[0].reveal?.a?.[0].label).toBe("Subcampo");
    expect(fields[0].reveal?.a?.[0].id).toBe("subcampo");
  });
});
