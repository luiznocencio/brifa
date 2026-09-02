"use client";
import { useState, useCallback } from "react";
import { newItem, type DemandData, type FieldDef } from "@/lib/demand-map";

const EMPTY: DemandData = { values: {}, items: [] };

export function useDemand(initial: DemandData = EMPTY) {
  const [demand, setDemand] = useState<DemandData>(initial);

  // Nível campanha.
  const setCampaignValue = useCallback((id: string, value: string) => {
    setDemand((d) => ({ ...d, values: { ...d.values, [id]: value } }));
  }, []);

  // Itens.
  const addItem = useCallback((typeId = "") => {
    setDemand((d) => ({ ...d, items: [...d.items, newItem(typeId)] }));
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setDemand((d) => ({ ...d, items: d.items.filter((it) => it.id !== itemId) }));
  }, []);

  const setItemType = useCallback((itemId: string, typeId: string) => {
    // Trocar o tipo do item zera os valores e os campos gerados pela IA.
    setDemand((d) => ({
      ...d,
      items: d.items.map((it) => (it.id === itemId ? { id: it.id, typeId, values: {} } : it)),
    }));
  }, []);

  const setItemValue = useCallback((itemId: string, fieldId: string, value: string) => {
    setDemand((d) => ({
      ...d,
      items: d.items.map((it) => (it.id === itemId ? { ...it, values: { ...it.values, [fieldId]: value } } : it)),
    }));
  }, []);

  const setItemCustomFields = useCallback((itemId: string, fields: FieldDef[]) => {
    setDemand((d) => ({
      ...d,
      items: d.items.map((it) => (it.id === itemId ? { ...it, customFields: fields } : it)),
    }));
  }, []);

  const setAll = useCallback((next: DemandData) => setDemand(next), []);
  const reset = useCallback(() => setDemand({ values: {}, items: [] }), []);

  return {
    demand,
    setCampaignValue,
    addItem,
    removeItem,
    setItemType,
    setItemValue,
    setItemCustomFields,
    setAll,
    reset,
  };
}
