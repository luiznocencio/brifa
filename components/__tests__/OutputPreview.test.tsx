import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OutputPreview } from "@/components/OutputPreview";

describe("OutputPreview", () => {
  it("mostra o texto e dispara onCopy", async () => {
    const onCopy = vi.fn();
    render(<OutputPreview text="SOLICITACAO DE DEMANDA" onCopy={onCopy} />);
    expect(screen.getByText(/SOLICITACAO DE DEMANDA/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /copiar/i }));
    expect(onCopy).toHaveBeenCalled();
  });
});
