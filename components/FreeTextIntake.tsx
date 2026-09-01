"use client";
import { useState } from "react";
import { aiInterpret } from "@/lib/ai-client";
import type { InterpretResult } from "@/lib/ai-core";

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
    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <label htmlFor="freetext" className="text-sm font-medium text-gray-700">
        Entrada rápida (opcional)
      </label>
      <textarea
        id="freetext"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Descreva a demanda do jeito que ela chegou…"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handle}
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Interpretando…" : "Interpretar"}
        </button>
        {error && (
          <span role="alert" className="text-sm text-red-600">
            Não consegui interpretar agora. Você pode preencher na mão.
          </span>
        )}
      </div>
    </div>
  );
}
