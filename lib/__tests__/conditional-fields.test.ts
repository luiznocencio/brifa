import { describe, it, expect } from "vitest";
import {
  expandFields,
  campaignVisibleFields,
  itemVisibleFields,
  type FieldDef,
  type DemandData,
  type DemandItem,
} from "@/lib/demand-map";
import { validateRequired } from "@/lib/validate";
import { generateDemandText } from "@/lib/generate-text";
import { normalizeCustomFields } from "@/lib/ai-core";

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

  it("expande recursivamente", () => {
    expect(expandFields(withReveal, { a: "x", a_x: "p" }).map((f) => f.id)).toEqual(["a", "a_x", "a_x_p", "b"]);
  });
});

describe("condicional universal da campanha: Prioridade = Urgente", () => {
  it("só revela e exige Motivo da urgência quando Urgente", () => {
    const normal: DemandData = { values: { prioridade: "Alta" }, items: [] };
    expect(campaignVisibleFields(normal).map((f) => f.id)).not.toContain("motivo_urgencia");

    const urgente: DemandData = { values: { prioridade: "Urgente" }, items: [] };
    expect(campaignVisibleFields(urgente).map((f) => f.id)).toContain("motivo_urgencia");
    expect(validateRequired(urgente).map((m) => m.field.id)).toContain("motivo_urgencia");
  });
});

describe("condicionais dos itens (via customFields da IA)", () => {
  const custom: FieldDef[] = [
    {
      id: "tem_x", label: "Tem X?", type: "select", required: false, options: ["Sim", "Não"],
      reveal: { Sim: [{ id: "detalhe_x", label: "Detalhe X", type: "text", required: true }] },
    },
  ];

  it("campo obrigatório oculto não entra nas lacunas", () => {
    const item: DemandItem = { id: "i1", typeId: "outros", values: { descricao_livre: "d" }, customFields: custom };
    expect(itemVisibleFields(item).map((f) => f.id)).not.toContain("detalhe_x");
  });

  it("ao selecionar a opção, o obrigatório revelado é exigido", () => {
    const demand: DemandData = {
      values: { cliente: "X", objetivo: "o", prazo: "2026-09-05", prioridade: "Alta" },
      items: [{ id: "i1", typeId: "outros", values: { descricao_livre: "d", tem_x: "Sim" }, customFields: custom }],
    };
    const ids = validateRequired(demand).filter((m) => m.itemId === "i1").map((m) => m.field.id);
    expect(ids).toContain("detalhe_x");
  });
});

describe("generate-text respeita os condicionais do item", () => {
  it("inclui o campo revelado quando ativo e exclui quando oculto", () => {
    const ativo: DemandData = {
      values: { cliente: "X" },
      items: [{ id: "i1", typeId: "av-video", values: { duracao: "60s", proporcao: "16:9", locucao: "Sim", idioma_locucao: "Português BR" } }],
    };
    expect(generateDemandText(ativo)).toContain("Idioma da locução: Português BR");

    const oculto: DemandData = {
      values: { cliente: "X" },
      items: [{ id: "i1", typeId: "av-video", values: { duracao: "60s", proporcao: "16:9", locucao: "Não", idioma_locucao: "Português BR" } }],
    };
    expect(generateDemandText(oculto)).not.toContain("Idioma da locução");
  });
});

describe("normalizeCustomFields entende reveal aninhado", () => {
  it("sanitiza os campos condicionais recursivamente", () => {
    const fields = normalizeCustomFields([
      { label: "Seletor", type: "select", options: ["a"], reveal: { a: [{ label: "Subcampo", type: "text" }] } },
    ]);
    expect(fields).toHaveLength(1);
    expect(fields[0].reveal?.a?.[0].label).toBe("Subcampo");
    expect(fields[0].reveal?.a?.[0].id).toBe("subcampo");
  });
});
