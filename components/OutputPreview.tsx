"use client";
import { Button } from "@/components/ui/Button";

interface Props {
  text: string;
  onCopy: () => void;
}

export function OutputPreview({ text, onCopy }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-label-sm)",
            fontWeight: "var(--fw-semibold)",
            letterSpacing: "var(--tracking-caps)",
            textTransform: "uppercase",
            color: "var(--text-subtle)",
          }}
        >
Briefing
        </h2>
        <Button type="button" onClick={onCopy} variant="filled" size="medium">
          Copiar
        </Button>
      </div>
      <pre
        className="whitespace-pre-wrap"
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-sm)",
          padding: "var(--space-large)",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-body-sm)",
          color: "var(--text-default)",
        }}
      >
        {text}
      </pre>
    </div>
  );
}
