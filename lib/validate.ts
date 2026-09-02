import { campaignVisibleFields, itemVisibleFields, type DemandData, type FieldDef } from "@/lib/demand-map";

// Um obrigatório em falta, com o item ao qual pertence (null = nível campanha).
export interface MissingField {
  itemId: string | null;
  field: FieldDef;
}

function isEmpty(v: string | undefined): boolean {
  return !v || v.trim() === "";
}

export function validateRequired(demand: DemandData): MissingField[] {
  const out: MissingField[] = [];

  // Nível campanha.
  for (const f of campaignVisibleFields(demand)) {
    if (f.required && isEmpty(demand.values[f.id])) out.push({ itemId: null, field: f });
  }

  // Cada item: precisa de tipo + seus obrigatórios visíveis.
  for (const item of demand.items) {
    if (isEmpty(item.typeId)) {
      out.push({ itemId: item.id, field: { id: "__tipo", label: "Tipo do item", type: "select", required: true } });
    }
    for (const f of itemVisibleFields(item)) {
      if (f.required && isEmpty(item.values[f.id])) out.push({ itemId: item.id, field: f });
    }
  }

  return out;
}
