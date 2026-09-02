"use client";
import { useState } from "react";
import { aiInterpret } from "@/lib/ai-client";
import type { InterpretResult } from "@/lib/ai-core";
import { Button } from "@/components/ui/Button";

interface Props {
  onInterpreted: (result: InterpretResult) => void;
}

export function FreeTextIntake({ onInterpreted }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handle() {
    if (!text.trim()) return;
    setLoading(true);
    setError(false);
    try {
      const result = await aiInterpret(text);
      onInterpreted(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex flex-col gap-2"
      style={{
        background: "var(--surface-sunken)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-large)",
      }}
    >
      <label
        htmlFor="freetext"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-body-sm)",
          fontWeight: "var(--fw-medium)",
          color: "var(--text-default)",
        }}
      >
        Me conta o que chegou
      </label>
      <textarea
        id="freetext"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Descreva a demanda do jeito que ela chegou…"
        className="w-full resize-y rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[color:var(--surface-card)] px-3 py-2.5 outline-none focus:border-[var(--color-brand)] focus:shadow-[var(--focus-ring)] transition-colors duration-150"
        style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body-md)", color: "var(--text-default)" }}
      />
      <div className="flex items-center gap-3">
        <Button type="button" onClick={handle} disabled={loading} variant="filled" size="medium">
          {loading ? "Brifando…" : "Brifar"}
        </Button>
        {error && (
          <span
            role="alert"
            style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body-sm)", color: "var(--color-danger)" }}
          >
            Não consegui brifar agora. Você pode preencher na mão.
          </span>
        )}
      </div>
    </div>
  );
}
