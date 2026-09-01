"use client";

interface Props {
  text: string;
  onCopy: () => void;
}

export function OutputPreview({ text, onCopy }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Texto da solicitação
        </h2>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white"
        >
          Copiar
        </button>
      </div>
      <pre className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-800">
        {text}
      </pre>
    </div>
  );
}
