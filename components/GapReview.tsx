"use client";

interface Props {
  gaps: string[];
}

export function GapReview({ gaps }: Props) {
  if (gaps.length === 0) return null;
  return (
    <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4">
      <p className="mb-2 text-sm font-semibold text-amber-800">
        Antes de gerar, confira o que está faltando:
      </p>
      <ul className="list-disc pl-5 text-sm text-amber-800">
        {gaps.map((g, i) => (
          <li key={i}>{g}</li>
        ))}
      </ul>
    </div>
  );
}
