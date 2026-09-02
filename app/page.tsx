"use client";
import { useEffect, useRef, useState } from "react";
import { useDemand } from "@/lib/useDemand";
import { DemandForm } from "@/components/DemandForm";
import { FreeTextIntake } from "@/components/FreeTextIntake";
import { GapReview } from "@/components/GapReview";
import { OutputPreview } from "@/components/OutputPreview";
import { validateRequired } from "@/lib/validate";
import { aiRedact } from "@/lib/ai-client";
import { saveDraft, loadDraft, clearDraft } from "@/lib/draft";
import { makeItemId, type DemandData } from "@/lib/demand-map";
import type { InterpretResult } from "@/lib/ai-core";
import { Button } from "@/components/ui/Button";

function hasContent(demand: DemandData): boolean {
  if (Object.values(demand.values).some((v) => v && v.trim())) return true;
  return demand.items.some((it) => it.typeId || Object.values(it.values).some((v) => v && v.trim()));
}

export default function Page() {
  const {
    demand,
    setCampaignValue,
    addItem,
    removeItem,
    setItemType,
    setItemValue,
    setItemCustomFields,
    setAll,
    reset,
  } = useDemand();

  const [gaps, setGaps] = useState<string[]>([]);
  const [campaignMissingIds, setCampaignMissingIds] = useState<string[]>([]);
  const [itemMissing, setItemMissing] = useState<Record<string, string[]>>({});
  const [output, setOutput] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [restored, setRestored] = useState(false);
  const initRef = useRef(false);

  // Restaura rascunho ao montar; senão, começa com um item vazio.
  // Restauração pós-mount é intencional (evita mismatch de hidratação SSR); o
  // ref garante uma única execução mesmo no double-invoke do StrictMode.
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const draft = loadDraft();
    if (draft && draft.items.length > 0) setAll(draft);
    else addItem();
    setRestored(true);
  }, [setAll, addItem]);

  // Autosave (só depois de restaurar e só quando há conteúdo real).
  useEffect(() => {
    if (restored && hasContent(demand)) saveDraft(demand);
  }, [demand, restored]);

  function handleInterpreted(result: InterpretResult) {
    const items = (result.items.length > 0 ? result.items : [{ typeId: "", values: {} }]).map((it) => ({
      id: makeItemId(),
      typeId: it.typeId,
      values: it.values ?? {},
    }));
    setAll({ values: { ...demand.values, ...result.campaignValues }, items });
  }

  async function handleGenerate() {
    const missing = validateRequired(demand);
    const campMissing = missing.filter((m) => m.itemId === null).map((m) => m.field.id);
    const perItem: Record<string, string[]> = {};
    for (const m of missing) {
      if (m.itemId) (perItem[m.itemId] ??= []).push(m.field.id);
    }
    setCampaignMissingIds(campMissing);
    setItemMissing(perItem);

    const idxOf = (itemId: string) => demand.items.findIndex((it) => it.id === itemId) + 1;
    const gapList = [
      ...(demand.items.length === 0 ? ["Adicione ao menos um item à campanha."] : []),
      ...missing.map((m) =>
        m.itemId === null
          ? `Falta preencher: ${m.field.label}.`
          : `Item ${idxOf(m.itemId)}: falta ${m.field.label}.`,
      ),
    ];
    setGaps(gapList);

    if (gapList.length > 0) {
      setOutput("");
      return;
    }

    setGenerating(true);
    try {
      const { text } = await aiRedact(demand);
      setOutput(text);
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    navigator.clipboard?.writeText(output);
  }

  function handleReset() {
    reset();
    addItem();
    clearDraft();
    setGaps([]);
    setCampaignMissingIds([]);
    setItemMissing({});
    setOutput("");
  }

  const canGenerate = !generating && demand.items.length > 0;

  return (
    <main
      className="mx-auto flex w-full flex-col gap-6 px-6 py-10 md:py-[var(--space-4xl)]"
      style={{ maxWidth: 820 }}
    >
      <header className="flex flex-col gap-1.5">
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-title-xl)",
            fontWeight: "var(--fw-extrabold)",
            letterSpacing: "var(--tracking-tight)",
            color: "var(--text-strong)",
          }}
        >
          BRIFA
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body-sm)", color: "var(--text-muted)" }}>
          Inteligência de briefing pra agência. Me conta o que chegou — o BRIFA faz as perguntas certas e transforma a demanda em direção pra criação.
        </p>
      </header>

      <FreeTextIntake onInterpreted={handleInterpreted} />

      <DemandForm
        demand={demand}
        onCampaignValue={setCampaignValue}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onSetItemType={setItemType}
        onSetItemValue={setItemValue}
        onSetItemCustomFields={setItemCustomFields}
        campaignMissingIds={campaignMissingIds}
        itemMissing={itemMissing}
      />

      <GapReview gaps={gaps} />

      <div className="flex gap-3">
        <Button type="button" onClick={handleGenerate} disabled={!canGenerate} variant="filled" size="large">
          {generating ? "Gerando…" : "Gerar briefing"}
        </Button>
        <Button type="button" onClick={handleReset} variant="outlined" size="large">
          Limpar
        </Button>
      </div>

      {output && <OutputPreview text={output} onCopy={handleCopy} />}
    </main>
  );
}
