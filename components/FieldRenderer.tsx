"use client";
import type { FieldDef } from "@/lib/demand-map";

interface Props {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
  highlight?: boolean;
}

export function FieldRenderer({ field, value, onChange, highlight }: Props) {
  const base =
    "w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 " +
    (highlight ? "border-red-400 bg-red-50" : "border-gray-300");

  const common = {
    id: field.id,
    "aria-invalid": highlight ? true : undefined,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange(e.target.value),
    placeholder: field.placeholder,
    className: base,
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={field.id} className="text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {field.type === "textarea" ? (
        <textarea {...common} rows={3} />
      ) : field.type === "select" ? (
        <select {...common}>
          <option value="">Selecione…</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input {...common} type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"} />
      )}
    </div>
  );
}
