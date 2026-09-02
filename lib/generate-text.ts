import { getTypeById, effectiveTypeFields, expandFields, TRUNK_FIELDS, type DemandData, type FieldDef } from "@/lib/demand-map";

function val(demand: DemandData, id: string): string {
  return (demand.values[id] ?? "").trim();
}

function labelOf(id: string): string {
  const f = TRUNK_FIELDS.find((x) => x.id === id);
  return f ? f.label : id;
}

function line(label: string, value: string): string {
  return `${label}: ${value}`;
}

export function generateDemandText(demand: DemandData): string {
  const type = getTypeById(demand.typeId);
  const typeLabel = type ? `${type.category} › ${type.label}` : "(não definido)";
  const blocks: string[] = [];

  // Cabeçalho — só as linhas que têm valor (Tipo sempre entra).
  const headerLines = ["SOLICITACAO DE DEMANDA", ""];
  if (val(demand, "cliente")) headerLines.push(line(labelOf("cliente"), val(demand, "cliente")));
  headerLines.push(`Tipo: ${typeLabel}`);
  const prioPrazo = [
    val(demand, "prioridade") && line(labelOf("prioridade"), val(demand, "prioridade")),
    val(demand, "prazo") && line(labelOf("prazo"), val(demand, "prazo")),
  ].filter(Boolean).join("    ");
  if (prioPrazo) headerLines.push(prioPrazo);
  blocks.push(headerLines.join("\n"));

  // OBJETIVO — só se preenchido.
  if (val(demand, "objetivo")) {
    blocks.push(["OBJETIVO", val(demand, "objetivo")].join("\n"));
  }

  // ESPECIFICAÇÃO TÉCNICA — apenas os campos preenchidos (condicionais inclusos);
  // omite a seção inteira se nada foi preenchido.
  const specFields: FieldDef[] = expandFields(effectiveTypeFields(demand), demand.values);
  const specLines = specFields
    .filter((f) => val(demand, f.id) !== "")
    .map((f) => line(f.label, val(demand, f.id)));
  if (specLines.length > 0) {
    blocks.push(["ESPECIFICACAO TECNICA", ...specLines].join("\n"));
  }

  // PÚBLICO / OBSERVAÇÕES — só o que foi preenchido; omite a seção se ambos vazios.
  const pubLines: string[] = [];
  if (val(demand, "publico")) pubLines.push(line(labelOf("publico"), val(demand, "publico")));
  if (val(demand, "observacoes")) pubLines.push(line(labelOf("observacoes"), val(demand, "observacoes")));
  if (pubLines.length > 0) {
    blocks.push(["PUBLICO / OBSERVACOES", ...pubLines].join("\n"));
  }

  return blocks.join("\n\n");
}
