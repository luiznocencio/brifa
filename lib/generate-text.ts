import { getTypeById, TRUNK_FIELDS, type DemandData, type FieldDef } from "@/lib/demand-map";

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

  const header = [
    "SOLICITACAO DE DEMANDA",
    "",
    line(labelOf("cliente"), val(demand, "cliente")),
    `${line(labelOf("solicitante"), val(demand, "solicitante"))}`,
    `Tipo: ${typeLabel}`,
    `${line(labelOf("prioridade"), val(demand, "prioridade"))}    ${line(labelOf("prazo"), val(demand, "prazo"))}`,
  ].join("\n");

  const objetivo = ["OBJETIVO", val(demand, "objetivo")].join("\n");

  const specFields: FieldDef[] = type ? type.fields : [];
  const specLines = specFields.map((f) => line(f.label, val(demand, f.id)));
  const spec = ["ESPECIFICACAO TECNICA", ...specLines].join("\n");

  const publico = [
    "PUBLICO / OBSERVACOES",
    line(labelOf("publico"), val(demand, "publico")),
    line(labelOf("observacoes"), val(demand, "observacoes")),
  ].join("\n");

  const aprovacao = ["APROVACAO", line(labelOf("aprovador"), val(demand, "aprovador"))].join("\n");

  return [header, "", objetivo, "", spec, "", publico, "", aprovacao].join("\n");
}
