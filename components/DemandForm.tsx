"use client";
import { campaignVisibleFields, type DemandData, type FieldDef } from "@/lib/demand-map";
import { FieldRenderer } from "@/components/FieldRenderer";
import { ItemCard } from "@/components/ItemCard";
import { Button } from "@/components/ui/Button";

interface Props {
  demand: DemandData;
  onCampaignValue: (id: string, value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (itemId: string) => void;
  onSetItemType: (itemId: string, typeId: string) => void;
  onSetItemValue: (itemId: string, fieldId: string, value: string) => void;
  onSetItemCustomFields: (itemId: string, fields: FieldDef[]) => void;
  campaignMissingIds: string[];
  itemMissing: Record<string, string[]>;
}

const sectionLegendStyle = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-label-sm)",
  fontWeight: "var(--fw-semibold)",
  letterSpacing: "var(--tracking-caps)",
  color: "var(--text-subtle)",
  textTransform: "uppercase" as const,
};

export function DemandForm({
  demand,
  onCampaignValue,
  onAddItem,
  onRemoveItem,
  onSetItemType,
  onSetItemValue,
  onSetItemCustomFields,
  campaignMissingIds,
  itemMissing,
}: Props) {
  const campaignFields = campaignVisibleFields(demand);

  return (
    <div className="flex flex-col gap-8">
      <fieldset className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <legend className="mb-2" style={sectionLegendStyle}>
          Dados da campanha
        </legend>
        {campaignFields.map((f) => (
          <div key={f.id} className={f.type === "textarea" ? "md:col-span-2" : ""}>
            <FieldRenderer
              field={f}
              value={demand.values[f.id] ?? ""}
              onChange={(v) => onCampaignValue(f.id, v)}
              highlight={campaignMissingIds.includes(f.id)}
            />
          </div>
        ))}
      </fieldset>

      <div className="flex flex-col gap-4">
        <div style={sectionLegendStyle}>Itens da campanha</div>
        {demand.items.map((item, i) => (
          <ItemCard
            key={item.id}
            item={item}
            index={i}
            canRemove={demand.items.length > 1}
            onSetType={onSetItemType}
            onSetValue={onSetItemValue}
            onSetCustomFields={onSetItemCustomFields}
            onRemove={onRemoveItem}
            missingIds={itemMissing[item.id] ?? []}
          />
        ))}
        <div>
          <Button type="button" onClick={onAddItem} variant="soft" size="medium">
            + Adicionar item
          </Button>
        </div>
      </div>
    </div>
  );
}
