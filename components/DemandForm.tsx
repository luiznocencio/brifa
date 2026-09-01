"use client";
import { TRUNK_FIELDS, DEMAND_TYPES, getTypeById, type DemandData } from "@/lib/demand-map";
import { FieldRenderer } from "@/components/FieldRenderer";

interface Props {
  demand: DemandData;
  onSetType: (typeId: string) => void;
  onSetValue: (id: string, value: string) => void;
  missingIds: string[];
}

export function DemandForm({ demand, onSetType, onSetValue, missingIds }: Props) {
  const type = getTypeById(demand.typeId);
  const galho = type ? type.fields : [];

  // Agrupa tipos por categoria para o select.
  const categories = Array.from(new Set(DEMAND_TYPES.map((t) => t.category)));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label htmlFor="tipo" className="text-sm font-medium text-gray-700">
          Tipo de demanda <span className="text-red-500">*</span>
        </label>
        <select
          id="tipo"
          value={demand.typeId}
          onChange={(e) => onSetType(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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
      </div>

      <fieldset className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
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
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
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
