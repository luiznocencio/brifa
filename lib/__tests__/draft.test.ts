import { describe, it, expect, beforeEach } from "vitest";
import { saveDraft, loadDraft, clearDraft, DRAFT_KEY } from "@/lib/draft";
import type { DemandData } from "@/lib/demand-map";

const demand: DemandData = { typeId: "social-post", values: { cliente: "Loja X" } };

describe("rascunho local", () => {
  beforeEach(() => localStorage.clear());

  it("salva e restaura", () => {
    saveDraft(demand);
    expect(loadDraft()).toEqual(demand);
  });

  it("retorna null quando não há rascunho", () => {
    expect(loadDraft()).toBeNull();
  });

  it("limpa o rascunho", () => {
    saveDraft(demand);
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it("retorna null (sem lançar) se o conteúdo estiver corrompido", () => {
    localStorage.setItem(DRAFT_KEY, "{não é json}");
    expect(loadDraft()).toBeNull();
  });
});
