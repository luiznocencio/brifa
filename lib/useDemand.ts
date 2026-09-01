"use client";
import { useState, useCallback } from "react";
import type { DemandData } from "@/lib/demand-map";

const EMPTY: DemandData = { typeId: "", values: {} };

export function useDemand(initial: DemandData = EMPTY) {
  const [demand, setDemand] = useState<DemandData>(initial);

  const setType = useCallback((typeId: string) => {
    setDemand((d) => ({ ...d, typeId }));
  }, []);

  const setValue = useCallback((id: string, value: string) => {
    setDemand((d) => ({ ...d, values: { ...d.values, [id]: value } }));
  }, []);

  const setAll = useCallback((next: DemandData) => setDemand(next), []);
  const reset = useCallback(() => setDemand(EMPTY), []);

  return { demand, setType, setValue, setAll, reset };
}
