import { describe, it, expect } from "vitest";
import { generateDemandText } from "@/lib/generate-text";
import type { DemandData } from "@/lib/demand-map";

const demand: DemandData = {
  values: { cliente: "Loja X", objetivo: "Inauguração", publico: "Bairro", prazo: "2026-09-05", prioridade: "Alta" },
  items: [
    { id: "i1", typeId: "impresso-panfleto", values: { formato_fechado: "A5", quantidade: "5000" } },
    { id: "i2", typeId: "impresso-cartaz", values: { formato_fechado: "A3", quantidade: "200" } },
  ],
};

describe("generateDemandText (campanha + itens)", () => {
  it("começa com o cabeçalho e traz os dados de campanha preenchidos", () => {
    const t = generateDemandText(demand);
    expect(t.startsWith("BRIEFING")).toBe(true);
    expect(t).toContain("Cliente / Campanha: Loja X");
    expect(t).toContain("OBJETIVO / TEMA");
    expect(t).toContain("Público-alvo: Bairro");
  });

  it("gera um bloco por item com seu tipo e specs preenchidas", () => {
    const t = generateDemandText(demand);
    expect(t).toContain("ITEM 1 — Impresso / Gráfico › Panfleto / Flyer");
    expect(t).toContain("ITEM 2 — Impresso / Gráfico › Cartaz / Pôster");
    expect(t).toContain("Quantidade: 5000");
    expect(t).toContain("Quantidade: 200");
  });

  it("omite campos vazios e seções vazias", () => {
    const t = generateDemandText(demand);
    expect(t).not.toContain("Observações:"); // observacoes de campanha vazia
    expect(t).not.toContain("Papel:"); // opcional vazio nos itens
  });

  it("não contém emojis (texto puro)", () => {
    expect(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(generateDemandText(demand))).toBe(false);
  });

  it("mostra o prazo próprio do item quando preenchido", () => {
    const d: DemandData = {
      values: { cliente: "X" },
      items: [{ id: "i1", typeId: "social-post", values: { formato: "Feed 1:1", onde_veicula: "IG", prazo_item: "2026-10-01" } }],
    };
    expect(generateDemandText(d)).toContain("2026-10-01");
  });
});
