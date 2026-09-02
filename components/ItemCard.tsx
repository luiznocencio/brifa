"use client";
import { useState } from "react";
import {
  getCategories,
  typesInCategory,
  categoryOfType,
  itemVisibleFields,
  type DemandItem,
  type FieldDef,
} from "@/lib/demand-map";
import { FieldRenderer } from "@/components/FieldRenderer";
import { CustomFieldsBuilder } from "@/components/CustomFieldsBuilder";

interface Props {
  item: DemandItem;
  index: number;
  canRemove: boolean;
  onSetType: (itemId: string, typeId: string) => void;
  onSetValue: (itemId: string, fieldId: string, value: string) => void;
  onSetCustomFields: (itemId: string, fields: FieldDef[]) => void;
  onRemove: (itemId: string) => void;
  missingIds: string[];
}

const selectClass =
  "w-full h-11 appearance-none rounded-[var(--radius-sm)] border bg-[color:var(--surface-card)] pl-3 pr-9 outline-none cursor-pointer transition-colors duration-150";

const labelStyle = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-body-sm)",
  fontWeight: "var(--fw-medium)",
  color: "var(--text-default)",
} as const;

function Caret() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="pointer-events-none absolute right-3" style={{ color: "var(--text-subtle)" }}>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ItemCard({ item, index, canRemove, onSetType, onSetValue, onSetCustomFields, onRemove, missingIds }: Props) {
  const derivedCat = categoryOfType(item.typeId);
  const [localCategory, setLocalCategory] = useState(derivedCat);
  const activeCategory = derivedCat || localCategory;

  function handleCategory(cat: string) {
    setLocalCategory(cat);
    if (item.typeId && categoryOfType(item.typeId) !== cat) onSetType(item.id, "");
  }

  const specFields = item.typeId ? itemVisibleFields(item) : [];
  const typeMissing = missingIds.includes("__tipo");

  return (
    <div
      className="flex flex-col gap-4 rounded-[var(--radius-lg)] p-4"
      style={{ background: "var(--surface-card)", border: "1px solid var(--border-default)" }}
    >
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-label-sm)", fontWeight: "var(--fw-semibold)", letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-brand)" }}>
          Item {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body-sm)", color: "var(--text-subtle)", background: "none", border: "none", cursor: "pointer" }}
          >
            Remover
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label style={labelStyle}>Categoria <span style={{ color: "var(--color-danger)" }}>*</span></label>
          <div className="relative flex items-center">
            <select
              value={activeCategory}
              onChange={(e) => handleCategory(e.target.value)}
              className={`${selectClass} border-[var(--border-default)] focus:border-[var(--color-brand)] focus:shadow-[var(--focus-ring)]`}
              style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body-md)", color: "var(--text-default)" }}
            >
              <option value="">Selecione a categoria…</option>
              {getCategories().map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Caret />
          </div>
        </div>

        {activeCategory && (
          <div className="flex flex-col gap-1.5">
            <label style={labelStyle}>Tipo <span style={{ color: "var(--color-danger)" }}>*</span></label>
            <div className="relative flex items-center">
              <select
                value={item.typeId}
                aria-invalid={typeMissing ? true : undefined}
                onChange={(e) => onSetType(item.id, e.target.value)}
                className={`${selectClass} ${typeMissing ? "border-[var(--color-danger)]" : "border-[var(--border-default)] focus:border-[var(--color-brand)] focus:shadow-[var(--focus-ring)]"}`}
                style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body-md)", color: "var(--text-default)" }}
              >
                <option value="">Selecione o tipo…</option>
                {typesInCategory(activeCategory).map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <Caret />
            </div>
          </div>
        )}
      </div>

      {specFields.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {specFields.map((f) => (
            <div key={f.id} className={f.type === "textarea" ? "md:col-span-2" : ""}>
              <FieldRenderer
                field={f}
                value={item.values[f.id] ?? ""}
                onChange={(v) => onSetValue(item.id, f.id, v)}
                highlight={missingIds.includes(f.id)}
              />
            </div>
          ))}
        </div>
      )}

      {item.typeId === "outros" && (
        <CustomFieldsBuilder
          description={item.values.descricao_livre ?? ""}
          hasFields={Boolean(item.customFields && item.customFields.length > 0)}
          onProposed={(fields) => onSetCustomFields(item.id, fields)}
        />
      )}
    </div>
  );
}
