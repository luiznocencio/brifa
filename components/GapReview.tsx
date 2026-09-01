"use client";

interface Props {
  gaps: string[];
}

export function GapReview({ gaps }: Props) {
  if (gaps.length === 0) return null;
  return (
    <div
      role="alert"
      style={{
        background: "var(--color-warning-soft)",
        border: "1px solid var(--color-warning)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-large)",
        color: "var(--text-default)",
      }}
    >
      <p
        className="mb-2"
        style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body-sm)", fontWeight: "var(--fw-semibold)" }}
      >
        Antes de gerar, confira o que está faltando:
      </p>
      <ul
        className="list-disc pl-5"
        style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body-sm)" }}
      >
        {gaps.map((g, i) => (
          <li key={i}>{g}</li>
        ))}
      </ul>
    </div>
  );
}
