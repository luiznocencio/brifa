import { getFieldsForType, type DemandData, type FieldDef } from "@/lib/demand-map";

export function validateRequired(demand: DemandData): FieldDef[] {
  return getFieldsForType(demand.typeId).filter((field) => {
    if (!field.required) return false;
    const value = demand.values[field.id];
    return !value || value.trim() === "";
  });
}
