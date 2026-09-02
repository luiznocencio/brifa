import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DemandForm } from "@/components/DemandForm";
import type { DemandData } from "@/lib/demand-map";

const demand: DemandData = { values: {}, items: [{ id: "i1", typeId: "offline-sinalizacao", values: {} }] };
const noop = vi.fn();

function renderForm(overrides: Record<string, unknown> = {}) {
  return render(
    <DemandForm
      demand={demand}
      onCampaignValue={noop}
      onAddItem={noop}
      onRemoveItem={noop}
      onSetItemType={noop}
      onSetItemValue={noop}
      onSetItemCustomFields={noop}
      campaignMissingIds={[]}
      itemMissing={{}}
      {...overrides}
    />,
  );
}

describe("DemandForm", () => {
  it("renderiza os campos da campanha", () => {
    renderForm();
    expect(screen.getByLabelText(/Cliente \/ Campanha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Prazo de entrega/i)).toBeInTheDocument();
  });

  it("renderiza o item com o cabeçalho e as specs do tipo", () => {
    renderForm();
    expect(screen.getByText(/^Item 1/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Medida real/i)).toBeInTheDocument();
  });

  it("tem o botão de adicionar item", () => {
    renderForm();
    expect(screen.getByRole("button", { name: /Adicionar item/i })).toBeInTheDocument();
  });

  it("marca campo do item faltando via itemMissing (aria-invalid)", () => {
    renderForm({ itemMissing: { i1: ["medida_real"] } });
    expect(screen.getByLabelText(/Medida real/i)).toHaveAttribute("aria-invalid", "true");
  });
});
