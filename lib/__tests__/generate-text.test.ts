import { describe, it, expect } from "vitest";
import { generateDemandText } from "@/lib/generate-text";
import type { DemandData } from "@/lib/demand-map";

const offline: DemandData = {
  typeId: "offline-sinalizacao",
  values: {
    cliente: "Loja X — Inauguração",
    solicitante: "Ana",
    objetivo: "Comunicar a nova loja na fachada",
    publico: "Clientes do bairro",
    prazo: "2026-09-05",
    prioridade: "Alta",
    aprovador: "Carlos",
    medida_real: "200 x 90 cm",
    material: "Lona",
    quantidade: "1",
    aplicacao_local: "Fachada da loja nova",
  },
};

describe("generateDemandText", () => {
  it("começa com o cabeçalho padronizado", () => {
    const text = generateDemandText(offline);
    expect(text.startsWith("SOLICITACAO DE DEMANDA")).toBe(true);
  });

  it("inclui o rótulo do tipo (categoria › label)", () => {
    const text = generateDemandText(offline);
    expect(text).toContain("Tipo: Produções Offline › Sinalização / Ambientação");
  });

  it("traz os blocos na ordem fixa", () => {
    const text = generateDemandText(offline);
    const iObj = text.indexOf("OBJETIVO");
    const iSpec = text.indexOf("ESPECIFICACAO TECNICA");
    const iPub = text.indexOf("PUBLICO / OBSERVACOES");
    const iAprov = text.indexOf("APROVACAO");
    expect(iObj).toBeGreaterThan(-1);
    expect(iSpec).toBeGreaterThan(iObj);
    expect(iPub).toBeGreaterThan(iSpec);
    expect(iAprov).toBeGreaterThan(iPub);
  });

  it("renderiza campos técnicos do galho com seus rótulos", () => {
    const text = generateDemandText(offline);
    expect(text).toContain("Medida real (L x A): 200 x 90 cm");
    expect(text).toContain("Quantidade: 1");
    expect(text).toContain("Aplicação / Local: Fachada da loja nova");
  });

  it("não contém emojis (texto puro)", () => {
    const text = generateDemandText(offline);
    // faixa de emojis comuns
    expect(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(text)).toBe(false);
  });

  it("mostra rótulo mesmo com valor vazio (campo pendente)", () => {
    const semObjetivo: DemandData = {
      typeId: "social-post",
      values: { cliente: "Y", formato: "Feed 1:1", onde_veicula: "Instagram" },
    };
    const text = generateDemandText(semObjetivo);
    // objetivo vazio ainda aparece como bloco rotulado
    expect(text).toContain("OBJETIVO");
  });

  it("renderiza observacoes com rótulo quando preenchida", () => {
    const comObservacoes: DemandData = {
      typeId: "offline-sinalizacao",
      values: {
        cliente: "Loja X — Inauguração",
        solicitante: "Ana",
        objetivo: "Comunicar a nova loja na fachada",
        publico: "Clientes do bairro",
        observacoes: "Cuidado com a cor da marca",
        prazo: "2026-09-05",
        prioridade: "Alta",
        aprovador: "Carlos",
        medida_real: "200 x 90 cm",
        material: "Lona",
        quantidade: "1",
        aplicacao_local: "Fachada da loja nova",
      },
    };
    const text = generateDemandText(comObservacoes);
    expect(text).toContain("Observações: Cuidado com a cor da marca");
  });

  it("mostra rótulo Observações mesmo quando vazio (consistência)", () => {
    const semObservacoes: DemandData = {
      typeId: "offline-sinalizacao",
      values: {
        cliente: "Loja X — Inauguração",
        solicitante: "Ana",
        objetivo: "Comunicar a nova loja na fachada",
        publico: "Clientes do bairro",
        prazo: "2026-09-05",
        prioridade: "Alta",
        aprovador: "Carlos",
        medida_real: "200 x 90 cm",
        material: "Lona",
        quantidade: "1",
        aplicacao_local: "Fachada da loja nova",
      },
    };
    const text = generateDemandText(semObservacoes);
    expect(text).toContain("Observações:");
  });
});
