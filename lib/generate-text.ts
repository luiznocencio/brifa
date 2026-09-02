import { getTypeById, CAMPAIGN_FIELDS, itemVisibleFields, type DemandData, type DemandItem } from "@/lib/demand-map";

function campVal(demand: DemandData, id: string): string {
  return (demand.values[id] ?? "").trim();
}

function itemVal(item: DemandItem, id: string): string {
  return (item.values[id] ?? "").trim();
}

function labelOfCampaign(id: string): string {
  const f = CAMPAIGN_FIELDS.find((x) => x.id === id);
  return f ? f.label : id;
}

function line(label: string, value: string): string {
  return `${label}: ${value}`;
}

export function generateDemandText(demand: DemandData): string {
  const blocks: string[] = [];

  // Cabeçalho da campanha — só o que foi preenchido.
  const headerLines = ["BRIEFING", ""];
  if (campVal(demand, "cliente")) headerLines.push(line(labelOfCampaign("cliente"), campVal(demand, "cliente")));
  const prioPrazo = [
    campVal(demand, "prioridade") && line(labelOfCampaign("prioridade"), campVal(demand, "prioridade")),
    campVal(demand, "prazo") && line(labelOfCampaign("prazo"), campVal(demand, "prazo")),
  ].filter(Boolean).join("    ");
  if (prioPrazo) headerLines.push(prioPrazo);
  if (campVal(demand, "motivo_urgencia")) headerLines.push(line("Motivo da urgência", campVal(demand, "motivo_urgencia")));
  blocks.push(headerLines.join("\n"));

  // OBJETIVO / TEMA (campanha).
  if (campVal(demand, "objetivo")) {
    blocks.push(["OBJETIVO / TEMA", campVal(demand, "objetivo")].join("\n"));
  }

  // PÚBLICO / OBSERVAÇÕES (campanha) — só o que foi preenchido.
  const pub: string[] = [];
  if (campVal(demand, "publico")) pub.push(line(labelOfCampaign("publico"), campVal(demand, "publico")));
  if (campVal(demand, "observacoes")) pub.push(line(labelOfCampaign("observacoes"), campVal(demand, "observacoes")));
  if (pub.length > 0) blocks.push(["PUBLICO / OBSERVACOES", ...pub].join("\n"));

  // Um bloco por item — só os campos preenchidos (condicionais e prazo próprio inclusos).
  demand.items.forEach((item, i) => {
    const type = getTypeById(item.typeId);
    const typeLabel = type ? `${type.category} › ${type.label}` : "(tipo não definido)";
    const itemLines = [`ITEM ${i + 1} — ${typeLabel}`];
    for (const f of itemVisibleFields(item)) {
      const v = itemVal(item, f.id);
      if (v) itemLines.push(line(f.label, v));
    }
    blocks.push(itemLines.join("\n"));
  });

  return blocks.join("\n\n");
}
