import { getFieldsForDemand, type DemandData, type FieldDef } from "@/lib/demand-map";

export function validateRequired(demand: DemandData): FieldDef[] {
  return getFieldsForDemand(demand).filter((field) => {
    if (!field.required) return false;
    const value = demand.values[field.id];
    return !value || value.trim() === "";
  });
}
