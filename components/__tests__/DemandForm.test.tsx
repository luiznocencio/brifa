import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DemandForm } from "@/components/DemandForm";
import type { DemandData } from "@/lib/demand-map";

const demand: DemandData = { typeId: "offline-sinalizacao", values: {} };

describe("DemandForm", () => {
  it("renderiza os campos do tronco comum", () => {
    render(
      <DemandForm demand={demand} onSetType={vi.fn()} onSetValue={vi.fn()} missingIds={[]} />,
    );
    expect(screen.getByLabelText(/Cliente \/ Campanha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Prazo de entrega/i)).toBeInTheDocument();
  });

  it("renderiza os campos do galho offline (medida real)", () => {
    render(
      <DemandForm demand={demand} onSetType={vi.fn()} onSetValue={vi.fn()} missingIds={[]} />,
    );
    expect(screen.getByLabelText(/Medida real/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Aplicação \/ Local/i)).toBeInTheDocument();
  });

  it("marca campos faltando via missingIds", () => {
    render(
      <DemandForm
        demand={demand}
        onSetType={vi.fn()}
        onSetValue={vi.fn()}
        missingIds={["cliente"]}
      />,
    );
    const input = screen.getByLabelText(/Cliente \/ Campanha/i);
    expect(input).toHaveAttribute("aria-invalid", "true");
  });
});
