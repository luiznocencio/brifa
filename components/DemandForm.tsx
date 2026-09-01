"use client";
import { TRUNK_FIELDS, DEMAND_TYPES, effectiveTypeFields, type DemandData } from "@/lib/demand-map";
import { FieldRenderer } from "@/components/FieldRenderer";

interface Props {
  demand: DemandData;
  onSetType: (typeId: string) => void;
  onSetValue: (id: string, value: string) => void;
  missingIds: string[];
}

const sectionLegendStyle = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-label-sm)",
  fontWeight: "var(--fw-semibold)",
  letterSpacing: "var(--tracking-caps)",
  color: "var(--text-subtle)",
  textTransform: "uppercase" as const,
};

export function DemandForm({ demand, onSetType, onSetValue, missingIds }: Props) {
  const galho = effectiveTypeFields(demand);

  // Agrupa tipos por categoria para o select.
  const categories = Array.from(new Set(DEMAND_TYPES.map((t) => t.category)));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="tipo"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-body-sm)",
            fontWeight: "var(--fw-medium)",
            color: "var(--text-default)",
          }}
        >
          Tipo de demanda <span style={{ color: "var(--color-danger)" }}>*</span>
        </label>
        <div className="relative flex items-center">
          <select
            id="tipo"
            value={demand.typeId}
            onChange={(e) => onSetType(e.target.value)}
            className="w-full h-11 appearance-none rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[color:var(--surface-card)] pl-3 pr-9 outline-none cursor-pointer focus:border-[var(--color-brand)] focus:shadow-[var(--focus-ring)] transition-colors duration-150"
            style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body-md)", color: "var(--text-default)" }}
          >
            <option value="">Selecione o tipo…</option>
            {categories.map((cat) => (
              <optgroup key={cat} label={cat}>
                {DEMAND_TYPES.filter((t) => t.category === cat).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
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
      </div>

      <fieldset className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <legend className="mb-2" style={sectionLegendStyle}>
          Informações gerais
        </legend>
        {TRUNK_FIELDS.map((f) => (
          <div key={f.id} className={f.type === "textarea" ? "md:col-span-2" : ""}>
            <FieldRenderer
              field={f}
              value={demand.values[f.id] ?? ""}
              onChange={(v) => onSetValue(f.id, v)}
              highlight={missingIds.includes(f.id)}
            />
          </div>
        ))}
      </fieldset>

      {galho.length > 0 && (
        <fieldset className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <legend className="mb-2" style={sectionLegendStyle}>
            Especificação técnica
          </legend>
          {galho.map((f) => (
            <div key={f.id} className={f.type === "textarea" ? "md:col-span-2" : ""}>
              <FieldRenderer
                field={f}
                value={demand.values[f.id] ?? ""}
                onChange={(v) => onSetValue(f.id, v)}
                highlight={missingIds.includes(f.id)}
              />
            </div>
          ))}
        </fieldset>
      )}
    </div>
  );
}
