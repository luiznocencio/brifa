"use client";
import { useState } from "react";
import { aiPropose } from "@/lib/ai-client";
import type { FieldDef } from "@/lib/demand-map";
import { Button } from "@/components/ui/Button";

interface Props {
  // Descrição livre da demanda (semente para a IA montar os campos).
  description: string;
  // Se já existem campos gerados (troca o rótulo do botão).
  hasFields: boolean;
  onProposed: (fields: FieldDef[]) => void;
}

export function CustomFieldsBuilder({ description, hasFields, onProposed }: Props) {
  const [loading, setLoading] = useState(false);
  const disabled = loading || description.trim() === "";

  async function handle() {
    if (description.trim() === "") return;
    setLoading(true);
    try {
      // aiPropose nunca lança (tem fallback local determinístico).
      const res = await aiPropose(description);
      onProposed(res.fields);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex flex-col gap-2 rounded-[var(--radius-lg)] p-4"
      style={{ background: "var(--color-brand-soft)", border: "1px solid var(--border-default)" }}
    >
      <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body-sm)", color: "var(--text-default)" }}>
        Descreva a demanda no campo acima e deixe a IA montar os campos técnicos necessários para ela.
      </p>
      <div>
        <Button type="button" onClick={handle} disabled={disabled} variant={hasFields ? "soft" : "filled"} size="medium">
          {loading ? "Montando…" : hasFields ? "Refazer campos com IA" : "Montar campos com IA"}
        </Button>
      </div>
    </div>
  );
}
