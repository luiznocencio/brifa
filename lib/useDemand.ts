"use client";
import { useState, useCallback } from "react";
import type { DemandData, FieldDef } from "@/lib/demand-map";

const EMPTY: DemandData = { typeId: "", values: {} };

export function useDemand(initial: DemandData = EMPTY) {
  const [demand, setDemand] = useState<DemandData>(initial);

  const setType = useCallback((typeId: string) => {
    // Trocar de tipo descarta campos gerados pela IA (só valem para "Outro").
    setDemand((d) => ({ typeId, values: d.values }));
  }, []);

  const setValue = useCallback((id: string, value: string) => {
    setDemand((d) => ({ ...d, values: { ...d.values, [id]: value } }));
  }, []);

  const setCustomFields = useCallback((fields: FieldDef[]) => {
    setDemand((d) => ({ ...d, customFields: fields }));
  }, []);

  const setAll = useCallback((next: DemandData) => setDemand(next), []);
  const reset = useCallback(() => setDemand(EMPTY), []);

  return { demand, setType, setValue, setCustomFields, setAll, reset };
}
