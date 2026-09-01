"use client";
import type { FieldDef } from "@/lib/demand-map";

interface Props {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
  highlight?: boolean;
}

// Estilo de controle no padrão Disrupy Input/Textarea/Select:
// altura 44, radius-sm, borda border-default, foco borda brand + focus-ring,
// erro (highlight) com borda danger (sem anel de foco azul nesse caso).
function controlClassName(highlight?: boolean, extra = "") {
  return [
    "w-full rounded-[var(--radius-sm)] border bg-[color:var(--surface-card)] outline-none",
    "transition-colors duration-150",
    highlight
      ? "border-[var(--color-danger)]"
      : "border-[var(--border-default)] focus:border-[var(--color-brand)] focus:shadow-[var(--focus-ring)]",
    extra,
  ].join(" ");
}

const controlTextStyle = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-body-md)",
  color: "var(--text-default)",
} as const;

export function FieldRenderer({ field, value, onChange, highlight }: Props) {
  const common = {
    id: field.id,
    "aria-invalid": highlight ? true : undefined,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange(e.target.value),
    placeholder: field.placeholder,
    style: controlTextStyle,
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={field.id}
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-body-sm)",
          fontWeight: "var(--fw-medium)",
          color: "var(--text-default)",
        }}
      >
        {field.label}
        {field.required && <span style={{ marginLeft: 4, color: "var(--color-danger)" }}>*</span>}
      </label>
      {field.type === "textarea" ? (
        <textarea
          {...common}
          rows={3}
          className={controlClassName(highlight, "resize-y px-3 py-2.5")}
        />
      ) : field.type === "select" ? (
        <div className="relative flex items-center">
          <select
            {...common}
            className={controlClassName(highlight, "h-11 appearance-none pl-3 pr-9 cursor-pointer")}
          >
            <option value="">Selecione…</option>
            {(field.options ?? []).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            className="pointer-events-none absolute right-3"
            style={{ color: "var(--text-subtle)" }}
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : (
        <input
          {...common}
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
          className={controlClassName(highlight, "h-11 px-3")}
        />
      )}
    </div>
  );
}
