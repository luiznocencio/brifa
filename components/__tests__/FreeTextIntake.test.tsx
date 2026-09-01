import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FreeTextIntake } from "@/components/FreeTextIntake";

afterEach(() => vi.restoreAllMocks());

describe("FreeTextIntake", () => {
  it("chama a IA e repassa o resultado", async () => {
    const fake = { typeId: "offline-sinalizacao", values: {}, unmatched: [] };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(fake), { status: 200 })),
    );
    const onInterpreted = vi.fn();
    render(<FreeTextIntake onInterpreted={onInterpreted} />);

    await userEvent.type(
      screen.getByPlaceholderText(/descreva a demanda/i),
      "adesivo pra fachada",
    );
    await userEvent.click(screen.getByRole("button", { name: /interpretar/i }));

    expect(onInterpreted).toHaveBeenCalledWith(fake);
  });

  it("mostra aviso em caso de erro, sem quebrar", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    render(<FreeTextIntake onInterpreted={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText(/descreva a demanda/i), "x");
    await userEvent.click(screen.getByRole("button", { name: /interpretar/i }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
