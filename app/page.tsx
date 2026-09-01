"use client";
import { useEffect, useState } from "react";
import { useDemand } from "@/lib/useDemand";
import { DemandForm } from "@/components/DemandForm";
import { FreeTextIntake } from "@/components/FreeTextIntake";
import { GapReview } from "@/components/GapReview";
import { OutputPreview } from "@/components/OutputPreview";
import { validateRequired } from "@/lib/validate";
import { aiRedact } from "@/lib/ai-client";
import { saveDraft, loadDraft, clearDraft } from "@/lib/draft";
import type { InterpretResult } from "@/lib/ai-core";

export default function Page() {
  const { demand, setType, setValue, setAll, reset } = useDemand();
  const [gaps, setGaps] = useState<string[]>([]);
  const [missingIds, setMissingIds] = useState<string[]>([]);
  const [output, setOutput] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [restored, setRestored] = useState(false);

  // Restaura rascunho ao montar.
  useEffect(() => {
    const draft = loadDraft();
    if (draft) setAll(draft);
    // Restauração pós-mount é intencional (evita mismatch de hidratação SSR):
    // renderiza vazio no servidor/primeiro paint e só então aplica o rascunho.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRestored(true);
  }, [setAll]);

  // Autosave (só depois de restaurar, pra não sobrescrever com vazio).
  useEffect(() => {
    if (restored && demand.typeId) saveDraft(demand);
  }, [demand, restored]);

  function handleInterpreted(result: InterpretResult) {
    setAll({ typeId: result.typeId, values: { ...demand.values, ...result.values } });
  }

  async function handleGenerate() {
    const missing = validateRequired(demand);
    setMissingIds(missing.map((f) => f.id));
    setGaps(missing.map((f) => `Falta preencher: ${f.label}.`));
    if (missing.length > 0) {
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
    clearDraft();
    setGaps([]);
    setMissingIds([]);
    setOutput("");
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-xl font-bold text-gray-900">Pauta de Demandas</h1>
        <p className="text-sm text-gray-500">
          Descreva ou preencha a demanda; a ferramenta monta o texto técnico pra gestão.
        </p>
      </header>

      <FreeTextIntake onInterpreted={handleInterpreted} />
      <DemandForm demand={demand} onSetType={setType} onSetValue={setValue} missingIds={missingIds} />
      <GapReview gaps={gaps} />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || !demand.typeId}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {generating ? "Gerando…" : "Gerar texto"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700"
        >
          Limpar
        </button>
      </div>

      {output && <OutputPreview text={output} onCopy={handleCopy} />}
    </main>
  );
}
