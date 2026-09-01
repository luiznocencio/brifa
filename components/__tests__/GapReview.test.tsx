import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GapReview } from "@/components/GapReview";

describe("GapReview", () => {
  it("não renderiza nada quando não há lacunas", () => {
    const { container } = render(<GapReview gaps={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lista as lacunas", () => {
    render(<GapReview gaps={["Falta preencher: Medida real (L x A)."]} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/Medida real/);
  });
});
