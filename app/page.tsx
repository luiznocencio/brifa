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
import { Button } from "@/components/ui/Button";

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
    <main
      className="mx-auto flex w-full flex-col gap-6 px-6 py-10 md:py-[var(--space-4xl)]"
      style={{ maxWidth: 760 }}
    >
      <header className="flex flex-col gap-1.5">
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-title-xl)",
            fontWeight: "var(--fw-bold)",
            color: "var(--text-strong)",
          }}
        >
          Pauta de Demandas
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body-sm)", color: "var(--text-muted)" }}>
          Descreva ou preencha a demanda; a ferramenta monta o texto técnico pra gestão.
        </p>
      </header>

      <FreeTextIntake onInterpreted={handleInterpreted} />
      <DemandForm demand={demand} onSetType={setType} onSetValue={setValue} missingIds={missingIds} />
      <GapReview gaps={gaps} />

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={generating || !demand.typeId}
          variant="filled"
          size="large"
        >
          {generating ? "Gerando…" : "Gerar texto"}
        </Button>
        <Button type="button" onClick={handleReset} variant="outlined" size="large">
          Limpar
        </Button>
      </div>

      {output && <OutputPreview text={output} onCopy={handleCopy} />}
    </main>
  );
}
